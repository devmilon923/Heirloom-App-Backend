import httpStatus from "http-status";
import ApiError from "../errors/ApiError";
import { IUser } from "../modules/user/user.interface";

export const validateUserLockStatus = async (user: IUser) => {
  if (user?.blockStatus === null || user?.blockStatus <= new Date()) {
    return true;
  } else {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Your account is temporarily blocked",
    );
  }
};
