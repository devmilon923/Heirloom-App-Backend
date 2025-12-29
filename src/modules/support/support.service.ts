import httpStatus from "http-status";
import supportModel from "./support.model";
import ApiError from "../../errors/ApiError";
import { ISupport } from "./support.interface";

export const createSupportService = async (
  name: string | undefined,
  email: string,
  msg: string,
  msgTitle: string,
) => {
  try {
    const createdSupport = await supportModel.create({
      name,
      email,
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

export const findSupportId = async (id: string): Promise<ISupport | null> => {
  return supportModel.findById(id);
};

export const supportDelete = async (id: string): Promise<void> => {
  await supportModel.findByIdAndUpdate(id, {
    isDeleted: true,
  });
};
