import mongoose, { get, Types } from "mongoose";
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
import { findRelation } from "../../utils/checkRelation";

const sendRequest = async (
  from: Types.ObjectId,
  to: Types.ObjectId,
  relation: TRelationStatus,
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
    },
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
const makeRealtimeAction = async (userId: Types.ObjectId, result: any) => {
  // Handle the "accepted" action
  if (result?.status === "accepted") {
    // Create a new conversation when the friend request is accepted
    const conversation = await MessagesServices.createConversation(
      result?.sendBy,
      result?.reciveBy,
    );
    const safeSender = typeof userId ? userId.toString() : userId?.toString();
    const receiverId =
      result?.reciveBy?.toString() === userId?.toString()
        ? result?.sendBy?.toString()
        : result?.reciveBy?.toString();

    // Format the conversation data (assuming it's for socket broadcasting)
    const formattedDataForSender = await formatConversationData(
      conversation?._id,
      safeSender,
    );
    const formattedDataForReciver = await formatConversationData(
      conversation?._id,
      receiverId,
    );

    // Send the formatted conversation data to both users via socket
    sendSocketConversation(formattedDataForSender, [
      new mongoose.Types.ObjectId(safeSender),
    ]);
    sendSocketConversation(formattedDataForReciver, [
      new mongoose.Types.ObjectId(receiverId),
    ]);
    // Optionally update the inbox socket stacks (not sure of the logic here, but this seems like another event to be broadcasted)
    await sendInboxSocketStacks(userId?.toString());
  }

  // Return the updated friend request result (with the updated status)
  return result;
};

const unfriendAction = async (
  requestId: Types.ObjectId,
  userId: Types.ObjectId,
) => {
  const getRelation = await findRelation({ userId, requestId });
  console.log(getRelation);
  console.log(getRelation.sendBy);
  if (getRelation.myRelation) {
    console.log("Inside");
    await Friends.findOneAndUpdate(
      {
        $or: [
          { reciveBy: getRelation.reciveBy, sendBy: getRelation.sendBy },
          { sendBy: getRelation.reciveBy, reciveBy: getRelation.sendBy },
        ],
        // reciveBy: getRelation.reciveBy,
        // sendBy: userId,
        relation: getRelation.myRelation,
      },
      {
        status: "unfriended",
      },
    );
  }
  const result = await Friends.findOneAndUpdate(
    {
      $or: [
        { reciveBy: getRelation.reciveBy, sendBy: getRelation.sendBy },
        { sendBy: getRelation.reciveBy, reciveBy: getRelation.sendBy },
      ],
      // sendBy: userId,
      // reciveBy: getRelation.reciveBy,
    },
    {
      status: "unfriended",
    },
    {
      new: true,
    },
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
  makeRealtimeAction,
  unfriendAction,
  pepoleSearch,
  updateRelation,
};
