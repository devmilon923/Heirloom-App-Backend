import mongoose, { Date, Document } from "mongoose";

export type IBookMark = {
  articalsId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;

  createdAt?: Date;
  isBooked: boolean;
  isDeleted: boolean;
} & Document;
