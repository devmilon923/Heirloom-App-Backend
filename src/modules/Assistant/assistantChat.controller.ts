import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { AssistantChatServices } from "./assistantChat.service";
import ApiError from "../../errors/ApiError";
import { IUserPayload } from "../../middlewares/roleGuard";
import paginationBuilder from "../../utils/paginationBuilder";

const sendAssistantMessage = catchAsync(async (req: Request, res: Response) => {
  const myMessage = req.body?.me;
  const userId = (req.user as IUserPayload)?.id; // Use type assertion to access id
  if (!myMessage) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Your message is required");
  }
  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User ID is required");
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message sent successfully!",
    data: myMessage,
  });
  await AssistantChatServices.sendAssistantMessage(myMessage, userId);
});

const getMyAssistantConversations = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as IUserPayload)?.id;
    const page = parseInt(req.query?.page as string) || 1;
    const limit = parseInt(req.query?.limit as string) || 10;
    const skip = (page - 1) * limit;
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "User ID is required");
    }
    const data =
      await AssistantChatServices.getMyAssistantConversations(userId);
    const paginatedData = data.slice(skip, skip + limit);
    const pagination = paginationBuilder({
      totalData: data.length,
      currentPage: page,
      limit,
    });
    // Fix prevPage/nextPage to be numbers (0 if null) for type compatibility
    const fixedPagination = {
      ...pagination,
      prevPage: pagination.prevPage ?? 0,
      nextPage: pagination.nextPage ?? 0,
    };
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Assistant conversations fetched successfully!",
      data: paginatedData,
      pagination: fixedPagination,
    });
  }
);

export const AssistantChatControllers = {
  sendAssistantMessage,
  getMyAssistantConversations,
};
