import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { TLegacy } from "./legacy.interface";
import ApiError from "../../errors/ApiError";
import { LegacyService } from "./legacy.service";
import { IUserPayload } from "../../middlewares/roleGuard";
import mongoose from "mongoose";
import { LegacyQueues } from "../../bull/queus/legacy.queus";

const addLegacy = catchAsync(async (req: Request, res: Response) => {
  const { recipients, messages, triggerDate, type }: TLegacy = req.body;

  const userId = (req.user as IUserPayload).id;
  if (Array.isArray(recipients) && recipients.length < 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid recipients format");
  }
  if (!messages?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Message is required");
  }
  if (!type?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Type is required");
  }
  if (!triggerDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Trigger Date is required");
  }
  const delay = new Date(triggerDate).getTime() - Date.now();

  if (delay < 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Time must be in the future");
  }
  const result = await LegacyService.addLegacy({
    user: new mongoose.Types.ObjectId(userId),
    recipients,
    messages,
    triggerDate,
    type,
  });

  LegacyQueues.triggerLegacyQueue({
    recipients,
    legacyId: result._id,
    delay,
  })
    .then((result) => {
      if (result.status === "completed") {
        console.log(
          `📬 Job ${"jobId" in result ? result.jobId : "N/A"} completed`
        );
      } else {
        console.warn(
          `⚠ Job ${"jobId" in result ? result.jobId : "N/A"} status: ${result.status}`,
          "error" in result ? result.error : undefined
        );
      }
    })
    .catch((error) => {
      console.error(`⛔ Failed to add job:`, error);
    });
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Legacy message added successfully!",
    data: result,
  });
});
const getLegacy = catchAsync(async (req: Request, res: Response) => {
  //   const { recipients, messages, triggerDate }: TLegacy = req.body;
  const userId = (req.user as IUserPayload).id;
  let query: any = {
    user: new mongoose.Types.ObjectId(userId),
    isDeleted: false,
  };

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await LegacyService.getLegacy(query, page, limit);

  let responseData =
    result?.legacys?.map((data: any) => {
      return {
        _id: data?._id,
        recipients: data?.recipients,
        message: data?.messages,
        time: data?.createdAt,
        type: data?.type || null,
      };
    }) || [];
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Legacy message get successfully!",
    data: {
      legacy: [...responseData],
      pagination: result?.pagination,
    },
  });
});
const getLegacyById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as IUserPayload).id;
  const result = await LegacyService.getLegacyById(
    new mongoose.Types.ObjectId(req.params?.legacyId),
    new mongoose.Types.ObjectId(userId)
  );
  let responseData = {
    _id: result?._id,
    recipients: result?.recipients,
    // title: `A Message From ${data?.user?.name}`,
    message: result?.messages,
    time: (result as any)?.createdAt, // Unsafe but works
  };
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Legacy message view successfully!",
    data: responseData,
  });
});
const deleteLegacyById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as IUserPayload).id;
  const result = await LegacyService.deleteLegacyById(
    new mongoose.Types.ObjectId(req.params?.legacyId),
    new mongoose.Types.ObjectId(userId)
  );
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invalid lagacy");
  }
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Legacy message deleted successfully!",
    data: req.params?.legacyId,
  });
});
const editLegacyById = catchAsync(async (req: Request, res: Response) => {
  const { recipients, messages, triggerDate }: TLegacy = req.body;
  console.log(req.body);
  const userId = (req.user as IUserPayload).id;
  const lagacyId = req.params?.legacyId;
  if (Array.isArray(recipients) && recipients.length < 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid recipients format");
  }
  if (!messages?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Message is required");
  }
  if (!triggerDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Trigger Date is required");
  }
  const result = await LegacyService.editLegacyById({
    user: new mongoose.Types.ObjectId(userId),
    legacyId: new mongoose.Types.ObjectId(lagacyId),
    recipients,
    messages,
    triggerDate,
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invalid lagacy");
  }
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Legacy message updated successfully!",
    data: result,
  });
});
const getTriggeredLegacyById = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as IUserPayload).id;
    const result = await LegacyService.getTriggeredLegacyById(
      new mongoose.Types.ObjectId(req.params?.legacyId),
      new mongoose.Types.ObjectId(userId)
    );
    if (!result) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid request");
    }
    let responseData = {
      _id: result?._id,
      user: result?.user,
      title: `A Message From ${typeof result?.user === "object" && "name" in (result?.user ?? {}) ? (result?.user as any).name : "Unknown User"}`,
      message: result?.messages,
      time: (result as any)?.createdAt, // Unsafe but works
    };

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Legacy message view successfully!",
      data: responseData,
    });
  }
);
const getTriggeredLegacy = catchAsync(async (req: Request, res: Response) => {
  //   const { recipients, messages, triggerDate }: TLegacy = req.body;
  const userId = (req.user as IUserPayload).id;
  let query: any = {
    recipients: { $in: new mongoose.Types.ObjectId(userId) },
    isDeleted: false,
    triggerStatus: true,
  };

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const result = await LegacyService.getLegacy(query, page, limit);
  let responseData =
    result?.legacys?.map((data: any) => {
      return {
        _id: data?._id,
        // recipients: data?.recipients,
        title: `A Message From ${data?.user?.name}`,
        message: data?.messages,
        time: data?.createdAt,
      };
    }) || [];
  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Triggered Legacy message get successfully!",
    data: {
      legacy: [...responseData],
      pagination: result?.pagination,
    },
  });
});
export const LegacyController = {
  addLegacy,
  getLegacy,
  getLegacyById,
  getTriggeredLegacyById,
  getTriggeredLegacy,
  deleteLegacyById,
  editLegacyById,
};
