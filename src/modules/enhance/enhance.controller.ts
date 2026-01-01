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

export const EnhanceWithAIController = { enhanceJournal };
