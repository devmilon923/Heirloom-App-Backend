import mongoose, { Schema } from "mongoose";
import { TConversation, TMessages } from "./messages.interface";

const messageSchema = new Schema<TMessages>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "conversations",
      required: true,
      trim: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      trim: true,
    },
    reciver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      trim: true,
    },
    messages: {
      type: String,
      required: false,
      trim: true,
    },
    image: {
      type: {
        publicFileURL: { type: String, trim: true },
        path: { type: String, trim: true },
      },
      required: false,
      default: {
        publicFileURL: "",
        path: "",
      },
    },

    readBy: [
      { type: Schema.Types.ObjectId, ref: "User", required: true, trim: true },
    ],
  },
  {
    timestamps: true,
  },
);

const conversationSchema = new Schema<TConversation>(
  {
    participants: [
      { type: Schema.Types.ObjectId, ref: "User", required: true, trim: true },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "messages",
      required: false,
      default: null,
      trim: true,
    },
    ai_user: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: false,
      default: [],
      trim: true,
    },
  },
  { timestamps: true },
);
export const Conversations = mongoose.model(
  "conversations",
  conversationSchema,
);
export const Messages = mongoose.model("messages", messageSchema);
