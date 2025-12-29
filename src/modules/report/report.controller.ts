import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";
import sendError from "../../utils/sendError";
import { findUserById, sendReportReply } from "../user/user.utils";
import { verifyToken } from "../../utils/JwtToken";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createReportService, reportList } from "./report.service";
import { emitNotification } from "../../utils/socket";

import mongoose, { Types } from "mongoose";
import reportModel from "./report.model";

export const addReport = catchAsync(async (req: Request, res: Response) => {
  let decoded: any;
  const suspectId = req?.params?.suspectId;
  try {
    decoded = verifyToken(req.headers.authorization);
  } catch (error: any) {
    return sendError(res, error);
  }
  const userId = decoded.id as string;
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const { reportMsg, msgTitle } = req.body;

  if (!msgTitle) {
    return sendError(res, {
      statusCode: httpStatus.BAD_REQUEST,
      message: "What kind of report ?",
    });
  }
  if (!reportMsg) {
    return sendError(res, {
      statusCode: httpStatus.BAD_REQUEST,
      message: "Describe your issue!",
    });
  }

  const msg = reportMsg;
  await createReportService(
    new mongoose.Types.ObjectId(userId),
    new mongoose.Types.ObjectId(suspectId),
    msg,
    msgTitle,
  );

  // Success response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      "Your report request has been received. We will review it and get back to you shortly.",
    data: null, // returning the updated user with the supportMsg field updated
  });

  //--------------------------> emit function <-------------------------
  // Define notification messages
  const userMsg =
    "📬 Thank you for reaching out! 💡 Our support team has received your message and will get back to you shortly. 🚀";

  const primaryMsg = `🔔 **Support Request Alert!** 🌟 A user has requested support:👤Name: ${decoded?.name || "Unknown"} ✉️ Email: ${decoded?.email} `;

  await emitNotification({
    userId: userObjectId, // Pass userId as required by your emitNotification function
    userMsg: userMsg,

    adminMsg: primaryMsg,
  });
  //--------------------------> emit function <-------------------------
});

export const getReport = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  //const date = req.query.date as string;
  // const address = req.query.address as string;
  //const search = req.query.search as string;

  const { reports, totalReport, totalPages } = await reportList(page, limit);

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  if (reports.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.NO_CONTENT,
      success: false,
      message: "No reports found in this area",
      data: [],
      pagination: {
        totalPage: totalPages,
        currentPage: page,
        prevPage: prevPage ?? 1,
        nextPage: nextPage ?? 1,
        limit,
        totalItem: totalReport,
      },
    });
  }

  const responseData = reports.map((report: any) => {
    return {
      _id: report._id,
      name: report.user?.name || "Unknown",
      username: report.user?.username || "Unknown",
      email: report.user?.email,
      suspectName: report?.suspect?.name || "Unknown",
      suspectUsername: report?.suspect?.username || "Unknown",
      suspectEmail: report?.suspect?.email,
      msg: report.msg,
      isReplyed: report?.isReplyed,
      subject: report.msgTitle,
      createdAt: report.createdAt,
    };
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All reports retrived successfully",
    data: responseData,
    pagination: {
      totalPage: totalPages,
      currentPage: page,
      prevPage: prevPage ?? 1,
      nextPage: nextPage ?? 1,
      limit,
      totalItem: totalReport,
    },
  });
});
export const makeReply = catchAsync(async (req: Request, res: Response) => {
  const { name, email, userMessage, adminResponse, id } = req.body;

  const result = await sendReportReply({
    name,
    email,
    userMessage,
    adminResponse,
  });
  await reportModel.findByIdAndUpdate(id, { isReplyed: true });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reply message send successfully",
    data: result,
  });
});
// export const deleteSupport = catchAsync(async (req: Request, res: Response) => {
//   const id = req.query?.supportId as string;

//   const support = await findSupportId(id);

//   if (!support) {
//     // return sendError(res, {
//     //   statusCode: httpStatus.NOT_FOUND,
//     //   message: "support not found .",
//     // });
//     throw new ApiError(httpStatus.NOT_FOUND, "support not found .");
//   }

//   if (support.isDeleted) {
//     // return sendError(res, {
//     //   statusCode: httpStatus.NOT_FOUND,
//     //   message: "This support is  already deleted.",
//     // });
//     throw new ApiError(
//       httpStatus.NOT_FOUND,
//       "This support is  already deleted."
//     );
//   }
//   await supportDelete(id);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "support deleted successfully",
//     data: null,
//   });
// });
