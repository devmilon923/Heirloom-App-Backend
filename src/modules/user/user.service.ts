import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { IUser } from "./user.interface";

import { OTPModel, UserModel } from "./user.model";

import ApiError from "../../errors/ApiError";

import { findUserByEmail, generateOTP } from "./user.utils";

import httpStatus from "http-status";
import { generateToken, verifyToken } from "../../utils/JwtToken";

import { TRole } from "../../config/role";
import { Types } from "mongoose";
import { Conversations } from "../messages/messages.model";

export const registerUserService = async (
  name: string,
  email: string,
  password: string
) => {
  const start = Date.now();

  // Check if user is already registered and get OTP record in parallel
  const [isUserRegistered, otpRecord] = await Promise.all([
    findUserByEmail(email),
    OTPModel.findOne({ email }).lean(), // Use lean to reduce overhead
  ]);
  console.log("DB queries done in", Date.now() - start, "ms");

  if (isUserRegistered) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "This account is already registered. Please log in or use a different account."
    );
  }

  // OTP handling logic
  const now = new Date();
  if (otpRecord && otpRecord.expiresAt > now) {
    const remainingTime = Math.floor(
      (otpRecord.expiresAt.getTime() - now.getTime()) / 1000
    );
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      `Please wait ${remainingTime} seconds before requesting a new OTP.`
    );
  }

  // Generate and save OTP
  const otp = generateOTP(); // Ensure OTP generation is lightweight

  console.log("OTP generated and saved in", Date.now() - start, "ms");

  console.log("Total time:", Date.now() - start, "ms");
  return { otp };
};

export const createUser = async ({
  username,
  email,
  image,
  gender,
  hashedPassword,
  fcmToken,
}: {
  username: string;
  email: string;
  gender: string;
  hashedPassword: string | null;
  fcmToken: string;
  image: any;
}): Promise<{ createdUser: IUser }> => {
  try {
    const createdUser = new UserModel({
      username: username?.toLowerCase(),
      email,
      gender,
      image,
      password: hashedPassword,
      fcmToken,
    });

    await createdUser.save();
    return { createdUser };
  } catch (error) {
    console.error("User creation failed:", error);
    throw new ApiError(500, "User creation failed");
  }
};
export const updateUserById = async (
  id: string,
  updateData: Partial<IUser>
): Promise<IUser | null> => {
  if (updateData?.name && updateData?.ageRange && updateData?.address) {
    return UserModel.findByIdAndUpdate(
      id,
      { ...updateData, profile_status: true },
      {
        new: true,

        runValidators: true,
      }
    );
  } else {
    return UserModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }
};

export const userDelete = async (id: string, email: string): Promise<void> => {
  const baseDeletedEmail = `deleted-account-${email}`;
  let deletedEmail = baseDeletedEmail;

  // Step 1: Check if base email exists and iterate to find the next available email
  for (
    let counter = 1;
    await UserModel.exists({ email: deletedEmail });
    counter++
  ) {
    deletedEmail = `${baseDeletedEmail}-${counter}`;
  }

  // Step 2: Update the user document
  await UserModel.findByIdAndUpdate(id, {
    isDeleted: true,
    email: deletedEmail,
  });
};
export const verifyForgotPasswordOTPService = async (
  email: string,
  otp: string
) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("User not found!");
  }

  const otpRecord = await OTPModel.findOne({ email });
  if (!otpRecord) {
    throw new Error("OTP record not found!");
  }

  // Check if OTP has expired
  const currentTime = new Date();
  if (otpRecord.expiresAt < currentTime) {
    throw new Error("OTP has expired");
  }

  // Validate the OTP
  if (otpRecord.otp !== otp) {
    throw new Error("Wrong OTP");
  }
  const userId = user._id as string;
  // Generate a new token for the user
  const token = generateToken({
    id: userId,
    email: user.email,
    role: user.role,
    name: user?.name,
    username: user?.username,
    image: user?.image?.publicFileURL,
  });

  return { token };
};
export const getAdminList = async (
  skip: number,
  limit: number,
  name?: string
): Promise<{ admins: IUser[]; totalAdmins: number; totalPages: number }> => {
  // Initialize the base query to fetch only admin users
  const query: any = {
    isDeleted: { $ne: true }, // Exclude deleted users
    role: { $in: ["primary", "secondary", "junior"] }, // Include only specified roles
  };

  // If a name filter is provided, add it to the query
  if (name) {
    query.name = { $regex: name, $options: "i" }; // Case-insensitive search
  }

  // Aggregation pipeline for pagination
  const pipeline: any[] = [
    {
      $match: query, // Apply the base query filters
    },
    {
      $sort: { createdAt: -1 }, // Sort by creation date (newest first)
    },
    {
      $skip: skip, // Pagination: skip based on `skip`
    },
    {
      $limit: limit, // Pagination: limit results based on `limit`
    },
    {
      $project: {
        image: 1,
        name: 1,
        role: 1,
        email: 1,
        createdAt: 1,
        phone: 1,
        address: 1,
        _id: 1,
      },
    },
  ];

  // Execute the aggregation pipeline
  const admins = await UserModel.aggregate(pipeline);

  // Count total admins (without pagination)
  const totalAdmins = await UserModel.countDocuments(query);
  const totalPages = Math.ceil(totalAdmins / limit);

  // Return the formatted response
  return { admins, totalAdmins, totalPages };
};
const getDashboardOverallStats = async (query: any) => {
  // Initialize the base query to fetch only admin users

  const result = await UserModel.countDocuments(query);
  return { totalUsers: result || 0 };
};
export const getUserList = async (
  skip: number,
  limit: number,
  date?: string,
  name?: string,
  email?: string,
  role?: string,
  requestStatus?: string
): Promise<{ users: IUser[]; totalUsers: number; totalPages: number }> => {
  const query: any = {
    isDeleted: { $ne: true },
  };

  if (date) {
    const [year, month, day] = date.split("-").map(Number); // Correct order: YYYY-MM-DD
    const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    query.createdAt = { $gte: startDate, $lte: endDate };
  }

  if (name) query.name = { $regex: name, $options: "i" };
  // if (role) query.role = { $regex: role, $options: "i" };
  if (requestStatus) {
    query.isRequest = { $regex: requestStatus, $options: "i" };
  }

  const pipeline: any[] = [
    { $match: query },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        image: 1,
        name: 1,
        username: 1,
        email: 1,
        role: 1,
        createdAt: 1,
        phone: 1,
        address: 1,
        isRequest: 1,
        managerInfoId: 1,
        _id: 1,
      },
    },
  ];

  // **Type Assertion to Fix the TypeScript Error**
  const users = (await UserModel.aggregate(pipeline)) as IUser[];

  const totalUsers = await UserModel.countDocuments(query);
  const totalPages = Math.ceil(totalUsers / limit);

  return { users, totalUsers, totalPages };
};

export const verifyOTPService = async (
  otp: string,
  authorizationHeader: string
) => {
  let decoded;
  try {
    decoded = verifyToken(authorizationHeader);
    console.log("-----------------------", decoded);
  } catch (error: any) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
  }

  const email = decoded.email as string;

  // 3) Now verify or update user in MongoDB as you need

  // 1) Retrieve the OTP from Redis
  const dbOTP = await OTPModel.findOne({ email: email });

  if (!dbOTP || dbOTP.otp !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  }

  // 2) OTP matches, remove it from Redis (to prevent reuse)
  // await delCache(email);

  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  // // Mark user as verified, if needed
  // if (!user.isVerified) {
  //   user.isVerified = true;
  //   await user.save();
  // }

  // 4) Generate a new token for the user
  const token = generateToken({
    id: user?._id,
    email: user.email,
    role: user.role,
    name: user?.name,
    username: user?.username,
    image: user?.image?.publicFileURL,
  });

  return { token, email, username: user.username, phone: user?.phone };
};
const getConversationById = async (
  userId: Types.ObjectId,
  conversationId: Types.ObjectId
) => {
  const query: any = {
    participants: { $in: userId },
    _id: conversationId, // Include only specified roles
  };
  try {
    const result = await Conversations.findOne(query);
    return result;
  } catch (error: any) {
    // Handle any errors during the user fetching or manager population
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Failed to retrieve users."
    );
  }
};
export const UserServices = { getDashboardOverallStats, getConversationById };
//------------->dashboard <----------------------------------------------------------------
