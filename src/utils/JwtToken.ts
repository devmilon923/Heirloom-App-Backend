import { sign, verify } from "jsonwebtoken";
import dotenv, { config } from "dotenv";
import { JWT_SECRET_KEY } from "../config";
import httpStatus from "http-status";

import jwt from "jsonwebtoken";
import { NextFunction, Request } from "express";
import { findUserById } from "../modules/user/user.utils";
import ApiError from "../errors/ApiError";
import { UserModel } from "../modules/user/user.model";
dotenv.config();

export type TokenData = {
  id: string;
  name: string;
  email: string;
  role: string;
  username: string;
  image: string;
  iat: number;
  exp: number;
};

const secret = JWT_SECRET_KEY as string;
if (!secret) throw new Error("JWT_SECRET is not defined");

export function generateToken({
  id,
  role,
  email,
  name,
  username,
  image,
}: {
  id: string;
  role: string;
  email: string;
  name: string;
  username: string;
  image: string;
}): string {
  return sign(
    { id, role, email, name, username, image },
    JWT_SECRET_KEY as string,
    {
      expiresIn: "7d",
    },
  );
}
export function verifySocketToken(token: string) {
  try {
    return verify(token, secret) as TokenData;
  } catch (error) {
    console.error(error);
    return null;
  }
}
export const verifyToken = (
  authHeader: string | undefined,
): { id?: string; email?: string } => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const errorMessage = "No token provided or invalid format.";
    throw { statusCode: httpStatus.UNAUTHORIZED, message: errorMessage };
  }
  const token = authHeader.split(" ")[1];
  //console.log(token, "token");
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY as string) as {
      id?: string;
      email?: string;
    };
    return decoded;
  } catch (error) {
    //console.log(error,"error---------->");
    throw new ApiError(498, "Invalid or expired token."); //-> 498 code is only for token expired status
  }
};
export const generateRegisterToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET_KEY as string, { expiresIn: "1h" });
};
export const generateRefreshToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET_KEY as string, { expiresIn: "90d" }); // 90 days (approximately 3 months)
};

export const generateAccessToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET_KEY as string, { expiresIn: "7d" }); // 1 hour
};

export const generateAccessRefreshToken = async (userId: string) => {
  try {
    const user = await UserModel.findById(userId);
    const accesstoken = generateAccessToken({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accesstoken, refreshToken };
  } catch (error) {
    throw new Error("failed during create access and refresh token");
  }
};

const expiresInOneHourForLogin = 365 * 24 * 60 * 60;
export function generateTokenForLogin({
  id,
  name,
  email,
  role,
  username,
  image,
}: Omit<TokenData, "iat" | "exp">) {
  return sign({ id, name, email, role, username, image }, secret, {
    expiresIn: expiresInOneHourForLogin,
  });
}
