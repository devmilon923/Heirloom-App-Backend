import mongoose, { Schema } from "mongoose";
import { INotification } from "./notification.interface";

const NotificationSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    adminId: [{ type: Schema.Types.ObjectId, ref: "User" }],

    adminMsg: { type: String },
    managerMsg: { type: String },
    userMsg: { type: String },

    isManagerRead: { type: Boolean, default: false },
    isUserRead: { type: Boolean, default: false },
    isAdminRead: { type: Boolean, default: false },
    unreadCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
