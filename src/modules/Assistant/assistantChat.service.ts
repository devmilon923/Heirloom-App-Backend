
import { OpenAIService } from "../../utils/openAI";
import { AssistantChats } from "./assistantChat.model";
import mongoose from "mongoose";
import { cacheManagerService } from "../../utils/cacheManager";

const sendAssistantMessage = async (
  myMessage: string,
  userId: string,
  user_name: string
) => {
  // 2. Save the user message to MongoDB
  const result: any = await AssistantChats.create({
    user: new mongoose.Types.ObjectId(userId),
    type: "me",
    message: myMessage,
  });
  cacheManagerService.updateAssistantRedisWindow({
    windowId: result?.user?.toString(),
    chat: {
      type: result?.type || "me",
      message: result?.message,
      time: result?.createdAt,
    },
  });
  const chatQuery = {
    user: userId?.toString(),
  };
  const journalQuery = {
    userId: userId?.toString(),
  };

  OpenAIService.genarateAssistantResponses({
    chatQuery,
    journalQuery,
    textPrompt: myMessage,
    userId,
    user_name,
  });
};

const getMyAssistantConversations = async (
  userId: string,
  limit: number,
  skip: number
) => {
  // Find all assistant chats for the user, sorted by most recent
  const chats = await AssistantChats.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  return chats;
};

export const AssistantChatServices = {
  sendAssistantMessage,
  getMyAssistantConversations,
};
