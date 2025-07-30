import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { journalServices } from "./journals.service";
import { IUserPayload } from "../../middlewares/roleGuard";
import mongoose, { Types } from "mongoose";

const addJournals = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as IUserPayload).id;
  const result = await journalServices.addJournals(
    req.body,
    new mongoose.Types.ObjectId(userId)
  );
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Journal added successfully",
    data: result,
  });
});
const getJournals = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as IUserPayload).id;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const searchQ = req.query.searchQ as string;
  type TQuery = {
    $or?: {
      title?: { $regex: string; $options: string };
      content?: { $regex: string; $options: string };
    }[];
    user: Types.ObjectId;
    isDeleted: boolean;
  };
  let query: TQuery = {
    user: new mongoose.Types.ObjectId(userId),
    isDeleted: false,
  };
  if (searchQ) {
    query.$or = [
      { title: { $regex: searchQ.toString(), $options: "i" } },
      { content: { $regex: searchQ.toString(), $options: "i" } },
    ];
  }

  const result = await journalServices.getJournals(query, page, limit);
  const responseData = result?.data?.map((data) => {
    return {
      _id: data?._id,
      title: data?.title,
      date: data?.customDate,
      content: data?.content,
    };
  });
  const pagination: any = result?.pagination;
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Journal get successfully",
    data: [...responseData],
    pagination,
  });
});
const deleteJournals = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as IUserPayload).id;
  const journalid = req.params.journalid;
  await journalServices.deleteJournals(
    new mongoose.Types.ObjectId(journalid),
    new mongoose.Types.ObjectId(userId)
  );
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Journal deleted successfully",
    data: journalid,
  });
});
const editJournals = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as IUserPayload).id;
  const journalid = req.params.journalid;
  const result = await journalServices.editJournals(
    req.body,
    new mongoose.Types.ObjectId(userId),
    new mongoose.Types.ObjectId(journalid)
  );
  const responseData = {
    _id: result?._id,
    title: result?.title,
    date: result?.customDate,
    content: result?.content,
  };
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Journal updated successfully",
    data: responseData,
  });
});
export const journalControllers = {
  addJournals,
  getJournals,
  deleteJournals,
  editJournals,
};
