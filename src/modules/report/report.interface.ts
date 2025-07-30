import mongoose, { Document, Types } from "mongoose";
export type IReport = {
  user: Types.ObjectId;
  suspect: Types.ObjectId;
  msgTitle: string;
  msg: string;
  createdAt: Date;
  isDeleted: boolean;
  isReplyed?: boolean;
} & Document;
