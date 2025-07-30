import mongoose, { Types } from "mongoose";
import { TRelationStatus } from "./friends.interface";
import { Friends } from "./friends.model";
import { MessagesServices } from "../messages/messages.service";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { UserModel } from "../user/user.model";
import {
  sendInboxSocketStacks,
  sendSocketConversation,
} from "../../utils/socket";
import { formatConversationData } from "../../utils/formatted";

const sendRequest = async (
  from: Types.ObjectId,
  to: Types.ObjectId,
  relation: TRelationStatus
) => {
  const result = await Friends.findOneAndUpdate(
    {
      sendBy: from,
      reciveBy: to,
    },
    {
      sendBy: from,
      reciveBy: to,
      relation: relation?.toLocaleLowerCase(),
      status: "requested",
    },
    {
      new: true,
      upsert: true,
    }
  );
  return result;
};
const getRequest = async (query: any, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const result = await Friends.find(query)
    .populate("sendBy", "name username image activeStatus")
    .populate("reciveBy", "name username image activeStatus")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  const totalFriend = await Friends.countDocuments(query).exec();

  // Calculate total pages
  const totalPages = Math.ceil(totalFriend / limit);
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return {
    friend: [...result],
    pagination: {
      totalPages,
      currentPage: page,
      prevPage,
      nextPage,
      limit,
      totalFriend,
    },
  };
};
const pepoleSearch = async (query: any, page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const result = await UserModel.find(query)
    .select("name username image activeStatus")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  const totalUser = await UserModel.countDocuments(query).exec();

  // Calculate total pages
  const totalPages = Math.ceil(totalUser / limit);
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return {
    friend: [...result],
    pagination: {
      totalPages,
      currentPage: page,
      prevPage,
      nextPage,
      limit,
      totalUser,
    },
  };
};
const makeAction = async (
  userId: Types.ObjectId,
  requestId: Types.ObjectId,
  action: string
) => {
  // Find the friend request and update its status
  const result = await Friends.findOneAndUpdate(
    {
      _id: requestId,
      reciveBy: userId,
      status: "requested", // Check that the request is in the "requested" status
    },
    {
      status: action, // Set the new status based on the provided action
    },
    {
      new: true, // Return the updated document after the update
    }
  );

  // If no matching document was found, throw an error
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invalid action"); // Handle invalid action case
  }

  // Handle the "accepted" action
  if (action === "accepted") {
    // Create a new conversation when the friend request is accepted
    const conversation = await MessagesServices.createConversation(
      result?.sendBy,
      result?.reciveBy
    );

    // Format the conversation data (assuming it's for socket broadcasting)
    const formattedData = await formatConversationData(
      conversation?._id,
      userId?.toString()
    );

    // Send the formatted conversation data to both users via socket
    sendSocketConversation(formattedData, [
      formattedData?.sender_id,
      formattedData?.reciver_id,
    ]);

    // Optionally update the inbox socket stacks (not sure of the logic here, but this seems like another event to be broadcasted)
    await sendInboxSocketStacks(userId?.toString());
  }

  // Return the updated friend request result (with the updated status)
  return result;
};

const unfriendAction = async (
  userId: Types.ObjectId,
  otherUserId: Types.ObjectId
) => {
  const result = await Friends.findOneAndUpdate(
    {
      $or: [
        { sendBy: userId, reciveBy: otherUserId },
        { sendBy: otherUserId, reciveBy: userId },
      ],
      status: "accepted",
    },
    {
      status: "unfriended",
    },
    {
      new: true,
    }
  );
  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid request");
  }
  // await MessagesServices.createConversation(result?.sendBy, result?.reciveBy);
  return result;
};
const updateRelation = async (query: any, updatedData: any) => {
  const result = await Friends.findOneAndUpdate(query, updatedData, {
    new: true,
  });
  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid request");
  }
  return result;
};
export const FriendServices = {
  sendRequest,
  getRequest,
  makeAction,
  unfriendAction,
  pepoleSearch,
  updateRelation,
};
