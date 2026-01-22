import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { FriendServices } from "./friends.service";
import { IUserPayload } from "../../middlewares/roleGuard";
import mongoose, { Types } from "mongoose";
import { RelationEnum } from "./friends.interface";
import ApiError from "../../errors/ApiError";
import { Friends } from "./friends.model";
import { findRelation } from "../../utils/checkRelation";

const sendRequest = catchAsync(async (req: Request, res: Response) => {
  const maleRelations = [
    "father",
    "brother",
    "son",
    "grandfather",
    "grandson",
    "uncle",
    "nephew",
    "father-in-law",
    "brother-in-law",
    "stepfather",
    "stepbrother",
    "cousin",
    "friend",
  ];

  const femaleRelations = [
    "mother",
    "sister",
    "daughter",
    "grandmother",
    "granddaughter",
    "aunt",
    "niece",
    "mother-in-law",
    "sister-in-law",
    "stepmother",
    "stepsister",
    "cousin",
    "friend",
  ];
  const user = req.user as IUserPayload;
  const reciveBy = req.body?.reciveBy;
  const relation = req.body?.relation;
  const isValidGenderRelation =
    (user?.gender === "male" && maleRelations?.includes(relation)) ||
    (user?.gender === "female" && femaleRelations?.includes(relation));

  if (!isValidGenderRelation) {
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      "Your gender and relation role are not match",
    );
  }
  if (!reciveBy) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Reciver not found");
  }
  if (!relation) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Relation field is required");
  }

  if (!RelationEnum?.includes(relation?.toLocaleLowerCase())) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Unsupported relation.");
  }
  const result = await FriendServices.sendRequest(
    new Types.ObjectId(user?.id),
    new Types.ObjectId(reciveBy || "n/a"),
    relation,
  );
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Requst send successfully!",
    data: result,
  });
});
const getRequest = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as IUserPayload).id;
  const relation = req.query.relation as string;
  const searchQ = req.query.searchQ as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const allowedRelations = ["friend", "familyin", "familyout"];

  if (!relation) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Relation field is required");
  }

  const normalizedRelation = relation.toLowerCase();
  if (!allowedRelations.includes(normalizedRelation)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Unsupported relation.");
  }

  let query: any = {};

  if (normalizedRelation === "friend") {
    query.relation = "friend";
    query.reciveBy = new mongoose.Types.ObjectId(userId);
    query.status = "requested";
  } else if (normalizedRelation === "familyin") {
    query.relation = { $ne: "friend" };
    query.reciveBy = new mongoose.Types.ObjectId(userId);
    query.status = "requested";
  } else if (normalizedRelation === "familyout") {
    query.relation = { $ne: "friend" };
    // query.$or = [{ reciveBy: new mongoose.Types.ObjectId(userId) }];
    query.sendBy = new mongoose.Types.ObjectId(userId);
    query.$or = [{ status: "requested" }, { status: "accepted" }];
  }

  const result = await FriendServices.getRequest(query, page, limit);

  let responseData =
    result?.friend?.map((data: any) => {
      return {
        _id: data?._id,
        name: data?.sendBy?.name || "Unknown",
        username: data?.sendBy?.username,
        image: data?.sendBy?.image?.publicFileURL || "",
        active: data?.sendBy?.activeStatus,
        relation: data?.relation,
        status: data?.status,
        time: data?.createdAt || null,
      };
    }) || [];

  if (searchQ?.trim()) {
    const lowerSearch = searchQ?.toLowerCase();
    responseData = responseData?.filter((data) =>
      data?.name?.toLowerCase()?.includes(lowerSearch),
    );
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Requests fetched successfully!",
    data: { ...result, friend: responseData },
  });
});

const action = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as IUserPayload).id;
  const requestId = req.params.requestId;
  const status = req.query.status as string;
  const type = ["rejected", "accepted"];
  if (!status) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Action not found");
  }
  if (!type?.includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Unsupported action");
  }

  if (status === "accepted") {
    const getRelation = await findRelation({
      userId: new mongoose.Types.ObjectId(userId),
      requestId: new mongoose.Types.ObjectId(requestId),
    });
    if (!getRelation?.myRelation) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Relation mismatch.");
    }
    Friends.create({
      sendBy: userId,
      relation: getRelation?.myRelation,
      reciveBy: getRelation?.reciveBy,
      status: "accepted",
    });
  }

  const result = await Friends.findOneAndUpdate(
    {
      _id: requestId,
      reciveBy: userId,
      status: "requested",
    },
    {
      status,
    },
    {
      new: true,
    },
  );

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invalid action"); // Handle invalid action case
  }
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Requst updated successfully!",
    data: result,
  });
  await FriendServices.makeRealtimeAction(
    new mongoose.Types.ObjectId(userId),
    result,
  );
});
const unfriendAction = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as IUserPayload).id;
  const requestId = req.params?.requestId;

  const result = await FriendServices.unfriendAction(
    new Types.ObjectId(requestId),
    new Types.ObjectId(userId),
  );
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Unfriend successfully!",
    data: result,
  });
});
const getList = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as IUserPayload).id;
  const relation = req.query.relation as string;
  const searchQ = req.query.searchQ as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const normalizedRelation = relation?.toLowerCase();

  let query: any = {
    reciveBy: new mongoose.Types.ObjectId(userId),
    status: "accepted",
  };

  if (normalizedRelation === "friend") {
    query.relation = "friend";
  } else if (normalizedRelation === "family") {
    query.relation = { $ne: "friend" };
  }

  const result = await FriendServices.getRequest(query, page, limit);

  let responseData =
    result?.friend?.map((data: any) => {
      // Determine the 'other' user in the relationship
      let otherUser;
      if (data?.sendBy?._id?.toString() === userId?.toString()) {
        otherUser = data?.reciveBy;
      } else {
        otherUser = data?.sendBy;
      }
      return {
        userId: otherUser?._id,
        requestId: data?._id,
        name: otherUser?.name || "Unknown",
        username: otherUser?.username,
        image: otherUser?.image?.publicFileURL || "",
        active: otherUser?.activeStatus,
        relation: data?.relation,
        status: data?.status,
      };
    }) || [];

  if (searchQ?.trim()) {
    const lowerSearch = searchQ?.toLowerCase();
    responseData = responseData?.filter((data) =>
      data?.name?.toLowerCase()?.includes(lowerSearch),
    );
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "List fetched successfully!",
    data: { ...result, friend: responseData },
  });
});
const pepoleSearch = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as IUserPayload).id;
  const searchQ = req.query.searchQ as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  let query: any = {
    isDeleted: false,
    isVerified: true,
    role: "user",
    // $ne: { user: new mongoose.Types.ObjectId(userId) },
  };
  if (searchQ?.trim()) {
    query.$or = [
      { name: { $regex: searchQ, $options: "i" } }, // Searching the "name" field, you can change it to your desired field.
      { username: { $regex: searchQ, $options: "i" } }, // Add other fields you want to search against
    ];
  }
  const requested = await Friends.find({
    $or: [
      {
        sendBy: new mongoose.Types.ObjectId(userId),
      },
      {
        reciveBy: new mongoose.Types.ObjectId(userId),
      },
    ],
    status: { $in: ["accepted", "requested"] },
  }).select("sendBy reciveBy");
  const excludedUserIds = new Set<string>();
  excludedUserIds.add(userId); // exclude self

  for (const friend of requested) {
    if (friend.sendBy.toString() !== userId) {
      excludedUserIds.add(friend.sendBy.toString());
    }
    if (friend.reciveBy.toString() !== userId) {
      excludedUserIds.add(friend.reciveBy.toString());
    }
  }
  const result = await FriendServices.pepoleSearch(
    { ...query, _id: { $nin: Array.from(excludedUserIds) } },
    page,
    limit,
  );
  console.log(excludedUserIds);
  let responseData =
    result?.friend?.map((data: any) => {
      return {
        _id: data?._id,
        name: data?.name || "Unknown",
        username: data?.username,
        image: data?.image?.publicFileURL || "",
        activeStatus: data?.activeStatus,
      };
    }) || [];

  if (searchQ?.trim()) {
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "List fetched successfully!",
    data: { ...result, friend: responseData },
  });
});
const updateRelation = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as IUserPayload).id;
  const requestId = req.params?.requestId;
  const relation = req.body?.relation;
  if (!relation) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Select a new relation");
  }
  let query: any = {
    _id: new mongoose.Types.ObjectId(requestId),
    $or: [
      {
        sendBy: new mongoose.Types.ObjectId(userId),
      },
      {
        reciveBy: new mongoose.Types.ObjectId(userId),
      },
    ],
    status: { $in: ["requested", "accepted"] },
  };
  const result = await FriendServices.updateRelation(query, {
    relation: relation,
    status: "requested",
  });
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Relation updated successfully!",
    data: result,
  });
});
export const FriendControllers = {
  sendRequest,
  getRequest,
  unfriendAction,
  action,
  getList,
  pepoleSearch,
  updateRelation,
};
