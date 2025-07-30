import { Document, Types } from "mongoose";

// Define the INotification type
export type INotification = {
  userId?: Types.ObjectId;
  managerId?: Types.ObjectId;
  adminId?: Types.ObjectId[]; // Optional array of ObjectId
  adminMsg?: string;
  managerMsg?: string;
  userMsg?: string;
  isManagerRead?: boolean;
  isUserRead?: boolean;
  isAdminRead?: boolean;
  unreadCount: number;
  createdAt: Date;
} & Document;

//--------> for push notifications <----------------------
export type INotificationPayload = {
  title: string;
  body: string;
};
