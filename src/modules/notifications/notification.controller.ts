import httpStatus from "http-status";

import jwt from "jsonwebtoken";

import { NextFunction, Request, Response } from "express";

import { findUserById } from "../user/user.utils";
import { NotificationModel } from "./notification.model";
import catchAsync from "../../utils/catchAsync";
import sendError from "../../utils/sendError";
import sendResponse from "../../utils/sendResponse";
import { verifyToken } from "../../utils/JwtToken";
import { INotification } from "./notification.interface";
import ApiError from "../../errors/ApiError";
import { sendPushNotificationToMultiple } from "./pushNotification/pushNotification.controller";

type ReadFields = "isManagerRead" | "isUserRead" | "isAdminRead";

type MsgFields = "adminMsg" | "managerMsg" | "userMsg";

export const getMyNotification = catchAsync(
  async (req: Request, res: Response) => {
    let decoded: any;
    try {
      decoded = verifyToken(req.headers.authorization as string);
    } catch (error: any) {
      return sendError(res, {
        statusCode: error.statusCode || httpStatus.UNAUTHORIZED,
        message: error.message || "Unauthorized.",
      });
    }

    const userId = decoded.id as string;

    // Find the user by userId
    const user = await findUserById(userId); // Assuming you have a function to find user
    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    // Pagination logic
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    // Define query parameters based on user role
    let query = {};
    let selectFields = "";
    let readField: ReadFields = "isUserRead"; // default
    let msgField: MsgFields = "userMsg"; // default

    switch (user.role) {
      case "manager":
        query = { managerId: user._id };
        selectFields = "managerMsg isManagerRead createdAt updatedAt";
        readField = "isManagerRead";
        msgField = "managerMsg";
        break;
      case "user":
        query = { userId: user._id };
        selectFields = "userMsg isUserRead createdAt updatedAt";
        readField = "isUserRead";
        msgField = "userMsg";
        break;
      case "admin":
        query = { adminId: user._id };
        selectFields = "adminMsg isAdminRead createdAt updatedAt";
        readField = "isAdminRead";
        msgField = "adminMsg";
        break;
      default:
        return sendError(res, {
          statusCode: httpStatus.BAD_REQUEST,
          message: "Invalid user role.",
        });
    }

    // Fetch notifications based on role
    const notifications = await NotificationModel.find(query)
      .select(selectFields)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Count total notifications based on role
    const totalNotifications =
      await NotificationModel.countDocuments(query).exec();

    // Calculate total pages
    const totalPages = Math.ceil(totalNotifications / limit);

    // Format the notifications
    const formattedNotifications = notifications.map((notification) => ({
      _id: notification._id,
      isReadable: notification[readField] as boolean,
      msg: notification[msgField] as string,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }));

    // Check if notifications are empty
    if (formattedNotifications.length === 0) {
      return sendResponse(res, {
        statusCode: httpStatus.NO_CONTENT,
        success: true,
        message: "You have no notifications.",
        data: {
          notifications: [],
        },
      });
    }

    // Pagination logic for prevPage and nextPage
    const prevPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;

    // Send response with pagination details
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Here are your notifications.",
      data: {
        notifications: formattedNotifications,
        pagination: {
          totalPages,
          currentPage: page,
          prevPage,
          nextPage,
          limit,
          totalNotifications,
        },
      },
    });

    // Mark notifications as read based on role
    await NotificationModel.updateMany(
      { ...query, [readField]: false },
      { $set: { [readField]: true } }
    );
  }
);

export const getUnreadBadgeCount = catchAsync(
  async (req: Request, res: Response) => {
    // Extract and verify the token
    let decoded;
    try {
      decoded = verifyToken(req.headers.authorization);
    } catch (error: any) {
      return sendError(res, error);
    }

    const userId = decoded.id as string;

    // Find the user by userId
    const user = await findUserById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    let unreadCount: number = 0;
    let rawNotifications: INotification[] = [];

    if (user.role === "manager") {
      unreadCount = await NotificationModel.countDocuments({
        managerId: user._id,
        isManagerRead: false,
      }).exec();

      rawNotifications = await NotificationModel.find({
        managerId: user._id,
        managerMsg: { $exists: true },
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .select("managerMsg createdAt")
        .exec();
    } else if (user.role === "user") {
      unreadCount = await NotificationModel.countDocuments({
        userId: user._id,
        isUserRead: false,
      }).exec();

      rawNotifications = await NotificationModel.find({
        userId: user._id,
        userMsg: { $exists: true },
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .select("userMsg createdAt")
        .exec();
    } else if (user.role === "admin") {
      unreadCount = await NotificationModel.countDocuments({
        adminId: user._id,
        isAdminRead: false,
      }).exec();

      rawNotifications = await NotificationModel.find({
        adminId: user._id,
        adminMsg: { $exists: true },
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .select("adminMsg createdAt")
        .exec();
    } else {
      return sendError(res, {
        statusCode: httpStatus.BAD_REQUEST,
        message: "Invalid user role.",
      });
    }

    // Transform notifications to have a unified 'msg' field
    let latestNotifications: { msg: string; createdAt: Date }[] = [];

    if (user.role === "manager") {
      latestNotifications = rawNotifications.map((notification) => ({
        msg: notification.managerMsg || "",
        createdAt: notification.createdAt,
      }));
    } else if (user.role === "user") {
      latestNotifications = rawNotifications.map((notification) => ({
        msg: notification.userMsg || "",
        createdAt: notification.createdAt,
      }));
    } else if (user.role === "admin") {
      latestNotifications = rawNotifications.map((notification) => ({
        msg: notification.adminMsg || "",
        createdAt: notification.createdAt,
      }));
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "Unread badge count and latest notifications retrieved successfully.",
      data: {
        unreadCount,
        latestNotifications,
      },
    });
  }
);

export const adminSendPushNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fcmTokens, title, body } = req.body;
    if (!fcmTokens || !title || !body) {
      return res.status(400).json({
        message: "Missing required fields: fcmTokens, title, and body.",
      });
    }

    // Ensure fcmTokens is an array of strings
    let tokens: string[] = [];
    if (typeof fcmTokens === "string") {
      tokens = [fcmTokens];
    } else if (Array.isArray(fcmTokens)) {
      tokens = fcmTokens;
    } else {
      return res.status(400).json({
        message: "fcmTokens must be a string or an array of strings.",
      });
    }

    // Use the multicast helper to send notifications to all provided tokens
    const response = await sendPushNotificationToMultiple(tokens, {
      title,
      body,
    });
    return res
      .status(200)
      .json({ message: "Push notifications sent successfully.", response });
  } catch (error) {
    next(error);
  }
};
