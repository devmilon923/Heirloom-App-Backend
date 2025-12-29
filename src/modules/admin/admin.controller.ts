// admin.controller.ts

import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import sendResponse from "../../utils/sendResponse";
import { AdminService } from "./admin.service";
import { cacheManagerService } from "../../utils/cacheManager";

const changeUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { days } = req.query;
  if (!days)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Days is required if you want to suspend anyone!",
    );

  const updateStatus = await AdminService.updateStatus(
    new Types.ObjectId(req.params?.userId),
    Number(days),
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User suspention action perform.",
    data: updateStatus,
  });
});
const clients = catchAsync(async (req: Request, res: Response) => {
  const { searchQ } = req.query;
  type TQuery = {
    $or?: {
      fname?: { $regex: string; $options: string };
      lname?: { $regex: string; $options: string };
    }[];
    role: string;
  };

  let query: TQuery = {
    role: "client",
  };

  if (searchQ) {
    query.$or = [
      { fname: { $regex: searchQ.toString(), $options: "i" } },
      { lname: { $regex: searchQ.toString(), $options: "i" } },
    ];
  }

  const clientsData = await AdminService.getUsers(query);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Get Clients",
    data: clientsData,
  });
});
const drivers = catchAsync(async (req: Request, res: Response) => {
  const { searchQ } = req.query;

  type TQuery = {
    $or?: {
      fname?: { $regex: string; $options: string };
      lname?: { $regex: string; $options: string };
    }[];
    role: string;
  };

  let query: TQuery = {
    role: "driver",
  };

  if (searchQ) {
    query.$or = [
      { fname: { $regex: searchQ.toString(), $options: "i" } },
      { lname: { $regex: searchQ.toString(), $options: "i" } },
    ];
  }

  const driverData = await AdminService.getUsers(query);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Get Drivers",
    data: driverData,
  });
});

const addArtical = catchAsync(async (req: Request, res: Response) => {
  if (!req.file)
    throw new ApiError(httpStatus.BAD_REQUEST, "Image is required");
  const result = await AdminService.createArtical(req.body, req.file);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Artical created successfully.",
    data: result,
  });
});
const updateArtical = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.updateArtical(
    req.body,
    req.file,
    new mongoose.Types.ObjectId(req.params.articalId),
  );
  if (!result) throw new ApiError(httpStatus.BAD_REQUEST, "Invalid submission");
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Artical update successfully.",
    data: result,
  });
});
const addFaq = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.createFAQ(req.body);
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "FAQ created successfully.",
    data: result,
  });
});
const updateFAQ = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.updateFAQ(
    req.body,
    new mongoose.Types.ObjectId(req.params.faqId),
  );
  if (!result) throw new ApiError(httpStatus.BAD_REQUEST, "Invalid submission");
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "FAQ update successfully.",
    data: result,
  });
});
const changeRole = catchAsync(async (req: Request, res: Response) => {
  const role = req.query?.role as string;
  const userId = req.params?.userId as string;
  const login = await cacheManagerService.getLogUser();
  if (login) {
    console.log(JSON.parse(login));
  } else {
    console.log("No login data found.");
  }
  let filter: any = {
    isDeleted: false,
    isVerified: true,
    _id: new mongoose.Types.ObjectId(userId),
  };
  const result = await AdminService.changeRole({ role, filter });
  if (!result) throw new ApiError(httpStatus.BAD_REQUEST, "Invalid submission");
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "FAQ update successfully.",
    data: result,
  });
});
export const AdminController = {
  changeUserStatus,
  clients,
  changeRole,
  updateFAQ,
  drivers,
  addArtical,

  updateArtical,

  addFaq,
};
