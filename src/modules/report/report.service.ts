import httpStatus from "http-status";
import supportModel from "./report.model";
import ApiError from "../../errors/ApiError";
import reportModel from "./report.model";
import { Types } from "mongoose";

export const createReportService = async (
  userId: Types.ObjectId,
  suspectId: Types.ObjectId,
  msg: string,
  msgTitle: string,
) => {
  try {
    const createdSupport = await reportModel.create({
      user: userId,
      suspect: suspectId,
      msg,
      msgTitle,
    });

    return createdSupport;
  } catch (error: any) {
    // console.error(error, "---------->>");
    const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message =
      error.message || "An error occurred while submitting the support msg.";
    throw new ApiError(statusCode, message);
  }
};

export const supportList = async (
  page: number,
  limit: number,

  //search?: string,
) => {
  const skip = (page - 1) * limit;
  const filter: any = { isDeleted: false };

  const support = await supportModel
    .find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 }); // Sort by most recent

  const totalSupport = await supportModel.countDocuments(filter);
  const totalPages = Math.ceil(totalSupport / limit);

  return { support, totalSupport, totalPages };
};
export const reportList = async (
  page: number,
  limit: number,

  //search?: string,
) => {
  const skip = (page - 1) * limit;
  const filter: any = { isDeleted: false };

  const reports = await reportModel
    .find(filter)
    .populate("user", "name email username")
    .populate("suspect", "name email username")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 }); // Sort by most recent

  const totalReport = await reportModel.countDocuments(filter);
  const totalPages = Math.ceil(totalReport / limit);

  return { reports, totalReport, totalPages };
};
// export const findSupportId = async (id: string): Promise<ISupport | null> => {
//   return supportModel.findById(id);
// };

// export const supportDelete = async (id: string): Promise<void> => {
//   await supportModel.findByIdAndUpdate(id, {
//     isDeleted: true,
//   });
// };
