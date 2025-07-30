import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { EnhanceWithAI } from "./enhance.service";

const enhanceJournal = catchAsync(async (req: Request, res: Response) => {
  const result = await EnhanceWithAI.enhanceJournal(req.body.content);
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Journal updated successfully",
    data: result,
  });
});
const saveData = catchAsync(async (req: Request, res: Response) => {
  const result = await EnhanceWithAI.saveData(req.body.content);
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "create embeddings success",
    data: result,
  });
});
const searchData = catchAsync(async (req: Request, res: Response) => {
  const result = await EnhanceWithAI.searchData(req.body.content);
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "search embeddings success",
    data: result,
  });
});
export const EnhanceWithAIController = { enhanceJournal, saveData, searchData };
