import { Types } from "mongoose";

export type TMessages = {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  reciver?: Types.ObjectId;
  messages: string;
  image: {
    publicFileURL: string;
    path: string;
  };

  readBy?: Types.ObjectId[] | null;
};

export type TConversation = {
  participants: Types.ObjectId[];
  lastMessage: Types.ObjectId;
  ai_user?: Types.ObjectId[];
};
