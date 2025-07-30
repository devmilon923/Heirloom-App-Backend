import mongoose, { Types } from "mongoose";

import { cacheManagerService } from "./cacheManager";

import { UserServices } from "../modules/user/user.service";

export const checkAIMode = async (
  conversation: Types.ObjectId,
  userId: Types.ObjectId
) => {
  const getConCache = await cacheManagerService.getConversation({
    conversationId: conversation,
  });
  if (getConCache) {
    if (getConCache?.ai_user?.includes(userId?.toString())) {
      console.log(true, "==================");
      return true;
    }
    console.log("cache block");
    return false;
  } else {
    const result = await UserServices.getConversationById(
      new mongoose.Types.ObjectId(userId),
      conversation
    );

    // console.log(result);
    if (result?.ai_user?.includes(new mongoose.Types.ObjectId(userId))) {
      return true;
    }
    cacheManagerService.setConversation({
      conversationId: conversation,
      data: result,
    });
    console.log("not in cache block");
    return false;
  }
};
