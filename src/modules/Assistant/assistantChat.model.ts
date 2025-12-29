import mongoose, { model, Schema } from "mongoose";
import { TAssistantChat } from "./assistantChat.interface";

const assistantChatSchema = new Schema<TAssistantChat>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    type: {
      type: String,
      enum: ["assistant", "me"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);
export const AssistantChats = model("assistantChats", assistantChatSchema);
