import { PineconeCollections } from "../../DB/pinecone";
import { OpenAIService } from "../../utils/openAI";
import { AssistantChats } from "./assistantChat.model";
import mongoose from "mongoose";
import { sendSocketAssistantStream } from "../../utils/socket";
import { TModes } from "../../modules/user/user.interface";
import { TRelation } from "../../modules/friends/friends.interface";

const sendAssistantMessage = async (myMessage: string, userId: string) => {
  // 1. Create embedding for the message
  const vector = await OpenAIService.embedding(myMessage);

  // 2. Save the user message to MongoDB and Pinecone in parallel (no need to await)
  // AssistantChats.create({
  //   user: new mongoose.Types.ObjectId(userId),
  //   type: "me",
  //   message: myMessage,
  // });
  // PineconeCollections.saveAssistantChat({
  //   vector,
  //   userId: userId.toString(),
  //   assistant_message: "", // No assistant reply yet
  //   my_message: myMessage,
  // });

  const chatQuery = {
    $or: [{ senderId: userId }, { reciverId: userId }],
  }; // You can enhance this to filter by user, type, etc.
  const journalQuery = {
    userId: userId,
  }; // Add journal context if available
  const moods: TModes = "😌 Calm"; // Use a valid TModes value
  const relation: TRelation = "friend"; // Use a valid TRelation value
  const textPrompt = myMessage;
  let fullResponse = "";
  console.log(userId);
  const stream = await OpenAIService.genarateAssistantResponses({
    chatQuery,
    journalQuery,
    textPrompt,
    moods,
    relation,
    userId,
  });
  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content;
    if (content) {
      fullResponse += content;
      sendSocketAssistantStream(userId, content);
    }
  }

  // 6. Save the assistant's response to MongoDB and Pinecone after streaming
  await Promise.all([
    AssistantChats.create({
      user: new mongoose.Types.ObjectId(userId),
      type: "assistant",
      message: fullResponse,
    }),
    PineconeCollections.saveAssistantChat({
      vector,
      userId: userId.toString(),
      assistant_message: fullResponse,
      my_message: myMessage,
    }),
  ]);

  return { reply: fullResponse };
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
