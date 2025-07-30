import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";
import { createBookMarkService, getBookMarkList } from "./BookMark.service";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";
import { verifyToken } from "../../utils/JwtToken";
import sendError from "../../utils/sendError";
import ApiError from "../../errors/ApiError";

import BookMark from "./BookMark.model";
import { findUserById } from "../user/user.utils";
import mongoose from "mongoose";

export const createBookMarkController = catchAsync(
  async (req: Request, res: Response) => {
    try {
      // Verify the token and extract the user ID.
      let decoded;
      try {
        decoded = verifyToken(req.headers.authorization);
      } catch (error: any) {
        return sendError(res, error);
      }

      const userId = decoded.id as string;
      // console.log(userId);
      const articalsId = req.query.id as string;
      const user = await findUserById(userId);
      if (
        user?.role !== "user" &&
        user?.role !== "manager" &&
        user?.role !== "admin"
      ) {
        throw new Error(
          "Guest user is not allowed to save articals in bookmark"
        );
      }
      // Check if a bookmark already exists for this user and event.
      const bookmark = await BookMark.findOne({ articalsId, userId });

      // If bookmark doesn't exist, create a new one.
      const savedBookMark = await createBookMarkService(
        new mongoose.Types.ObjectId(userId),
        new mongoose.Types.ObjectId(articalsId)
      );

      return sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Event added on bookmark successfully",
        data: savedBookMark,
      });
    } catch (error: any) {
      throw new ApiError(
        error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
        error.message ||
          "Unexpected error occurred while adding event on bookmark"
      );
    }
  }
);
export const removeBookMarkController = catchAsync(
  async (req: Request, res: Response) => {
    try {
      // Verify the token and extract the user ID.
      let decoded;
      try {
        decoded = verifyToken(req.headers.authorization);
      } catch (error: any) {
        return sendError(res, error);
      }

      const userId = decoded.id as string;
      // console.log(userId);
      const articalsId = req.query.id as string;
      const user = await findUserById(userId);
      if (
        user?.role !== "user" &&
        user?.role !== "manager" &&
        user?.role !== "admin"
      ) {
        throw new Error(
          "Guest user is not allowed to save articals in bookmark"
        );
      }
      // Check if a bookmark already exists for this user and event.
      const bookmark = await BookMark.findOneAndDelete({ articalsId, userId });

      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Bookmark deleted successfully",
        data: bookmark,
      });
    } catch (error: any) {
      throw new ApiError(
        error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
        error.message ||
          "Unexpected error occurred while adding event on bookmark"
      );
    }
  }
);
export const getBookMarkController = catchAsync(
  async (req: Request, res: Response) => {
    // Verify the token and extract the user ID.
    let decoded;
    try {
      decoded = verifyToken(req.headers.authorization);
    } catch (error: any) {
      return sendError(res, error);
    }
    const userId = decoded.id as string;

    // Parse pagination parameters from the query string.
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Call the service function.
    const result = await getBookMarkList(
      new mongoose.Types.ObjectId(userId),
      page,
      limit
    );
    // Assuming result has the shape: { data: bookmarks, pagination: { totalPage, currentPage, prevPage, nextPage, limit, totalItem } }
    const bookmarks = result.data;
    // const pagination = result.pagination;

    if (!bookmarks || bookmarks.length === 0) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "No bookmarks found",
        data: [],
        // pagination,
      });
    }

    // Map response data to include only id, isBooked, createdAt, and event details.

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Bookmarks retrieved successfully",
      data: result,
      // pagination,
    });
  }
);
