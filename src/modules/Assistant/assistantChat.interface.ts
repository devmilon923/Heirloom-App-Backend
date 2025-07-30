import { Types } from "mongoose";

export type TAssistantChat = {
  user: Types.ObjectId;
  type: "me" | "assistant";
  message: string;
};
