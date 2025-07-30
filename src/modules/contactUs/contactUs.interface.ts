import { Document } from "mongoose";

export type IContactUs = {
  message: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
  isDeleted: boolean;
} & Document;
