import mongoose, { Document } from "mongoose";
export type ISupport = {
  name: string;
  email: string;
  msgTitle: string;
  msg: string;
  createdAt: Date;
  isDeleted: boolean;
} & Document;
