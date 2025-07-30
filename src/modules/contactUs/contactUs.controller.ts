import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";
import {
  createMessage,
  getMessageById,
  getMessages,
  messageDelete,
} from "./contactUs.service";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";
import { emitNotification } from "../../utils/socket";
import nodemailer from "nodemailer";
import sendError from "../../utils/sendError";
import { UserModel } from "../user/user.model";

export const createMessageController = catchAsync(
  async (req: Request, res: Response) => {
    const { message, name, email, phone } = req.body;

    // Call the service to create the message
    const createdMessage = await createMessage({
      message,
      name,
      email,
      phone,
    });

    //--------------------------> emit function <-------------------------

    //--------------------------> emit function <-------------------------
    // Send a successful response
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Message created successfully",
      data: createdMessage,
      pagination: undefined, // Pagination is not applicable here, so leave undefined
    });
  },
);

export const getMessagesController = catchAsync(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const date = req.query.date as string;
    const name = req.query.name as string;

    // Fetch messages using the service with search and pagination
    const { messages, totalMessages, totalPages } = await getMessages(
      page,
      limit,
      date,
      name,
    );

    const prevPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;

    if (messages.length === 0) {
      return sendResponse(res, {
        statusCode: httpStatus.NO_CONTENT,
        success: false,
        message: "No messages found.",
        data: [],
        pagination: {
          totalPage: totalPages,
          currentPage: page,
          prevPage: prevPage ?? 1,
          nextPage: nextPage ?? 1,
          limit,
          totalItem: totalMessages,
        },
      });
    }

    const responseData = messages.map((message) => {
      return {
        _id: message._id,
        message: message.message,
        name: message.name,
        email: message.email,
        phone: message.phone,
        createdAt: message.createdAt,
      };
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All messages retrieved successfully",
      data: responseData,
      pagination: {
        totalPage: totalPages,
        currentPage: page,
        prevPage: prevPage ?? 1,
        nextPage: nextPage ?? 1,
        limit,
        totalItem: totalMessages,
      },
    });
  },
);

export const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const id = req.query?.id as string;

  const message = await getMessageById(id);

  if (!message) {
    return sendError(res, {
      statusCode: httpStatus.NOT_FOUND,
      message: "message not found .",
    });
  }

  await messageDelete(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "contact us message deleted successfully",
    data: null,
  });
});
