import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { ArticalsModel } from "./articals.model";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";

const getArticals = catchAsync(async (req: Request, res: Response) => {
  const result = await ArticalsModel.find({});
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Get Articals",
    data: result,
  });
});
export const ArticalsController = { getArticals };
