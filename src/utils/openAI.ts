import OpenAI from "openai";
import { TModes } from "../modules/user/user.interface";
import { TRelation } from "../modules/friends/friends.interface";
import { PineconeCollections } from "../DB/pinecone";
import redisClient from "./Redis";
import { logger } from "../logger/logger";
import mongoose from "mongoose";
import { cacheManagerService } from "./cacheManager";
import { sendSocketAssistantStream } from "./socket";
import { AssistantChats } from "../modules/Assistant/assistantChat.model";

const openai = new OpenAI({
  apiKey: process.env.GPT_KEY,
});
const embedding = async (text: string) => {
  const createEmbeddings = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1024,
  });
  return createEmbeddings.data[0].embedding;
};
const chatWithAI = async (context: any, question: string) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",

    messages: [
      {
        role: "system",
        content: `You are a warm, emotionally-attuned conversational partner. Always reply naturally and personally—as if speaking to a friend. Prioritize clarity, empathy, and relevance. When provided with conversation context, follow this lookup order: (1) look for relevant information in the most recent messages first; (2) if nothing relevant is found, consult older chat history; (3) if still missing necessary context, consult the user's journal entries. Acknowledge emotions briefly and ask one concise clarifying question only if needed. Keep replies concise unless the user requests more. Never state or imply you are an AI or assistant.`,
      },
      {
        role: "user",
        content: `Context (use to personalize):\n${typeof context === "string" ? context : JSON.stringify(context, null, 2)}\n\nMessage to reply to:\n${question}\n\nInstructions: When composing your reply, first try to use the most recent messages for context. If recent messages don't provide enough information, check older chat history, then journal entries as a last resort. Produce one clear, human-feeling reply. Do not use markdown, labels, or special formatting. If you need one detail to answer better, ask a single, focused clarifying question.`,
      },
    ],
  });
  return response?.choices[0]?.message?.content;
};
const enhanceWithAI = async (content: string) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that enhances mini journal entries by making them clearer, more expressive, and emotionally engaging, while preserving the original meaning.",
      },
      { role: "user", content },
    ],
    stream: true,
  });

  return response;
};
const genarateAiResponses = async ({
  chatQuery,
  journalQuery,
  textPrompt,
  moods,
  relation,
  recentMessage,
  userId,
  sender_name,
  receiver_name,
}: {
  chatQuery: any;
  journalQuery: any;
  recentMessage: any;
  textPrompt: string;
  moods: TModes;
  relation: TRelation;
  userId: string;
  sender_name: string;
  receiver_name: string;
}) => {
  const getAssistantChatContext: any =
    await PineconeCollections.assistantchatCollection.searchRecords({
      query: {
        topK: 10,
        filter: {
          user: userId?.toString(),
        },
        inputs: { text: textPrompt },
      },
    });
  const oldMemory = getAssistantChatContext?.result?.hits;
  // Format chat history as 'me:' and 'other:'
  const assistantOldChatsSummaries = oldMemory?.map((res: any) => {
    const fields = res?.fields;
    return {
      assistantChatsSummaries: fields?.summaries,
      time: fields.createdAt,
    };
  });
  // console.log("long memory");
  // console.log(assistantOldChatsSummaries);
  const getChatContext: any =
    await PineconeCollections.chatCollection.searchRecords({
      query: {
        topK: 10,
        filter: chatQuery,
        inputs: { text: textPrompt },
      },
    });
  const chat = getChatContext?.result?.hits;
  const chatContext = chat?.map((res: any) => {
    const fields = res?.fields;
    const isCurrentUser = fields?.senderId === userId?.toString();
    return {
      [isCurrentUser ? sender_name : receiver_name]:
        fields?.chat || fields?.message || "",
      time: fields?.createdAt,
    };
  });

  const getJournalContext: any =
    await PineconeCollections.journalCollection.searchRecords({
      query: {
        topK: 5,
        filter: journalQuery,
        inputs: { text: textPrompt },
      },
    });
  const journal = getJournalContext?.result?.hits;
  const journalContext = journal?.map((res: any) => {
    return {
      journalTitle: res?.fields?.title,
      content: res?.fields?.content,
      createdAt: res?.fields?.createdAt,
    };
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a natural, emotionally-attuned conversational partner. Use mood (${moods}) and relationship (${relation}) to set tone. Follow this context-priority: (1) look for relevant details in the most recent messages first; (2) if recent messages lack needed info, consult older chat history; (3) consult journal entries only as a last resort to refine tone or recall facts; (4) Also, you need to know that you have a personal AI assistant, and there are lots of chats summarise with your assistant so you need to consider that data as well. \n\nNote: All types of data have timestamps, so you need to understand which data is from the past, present, or future, and respond accordingly. Be short, human, and helpful. If the message is ambiguous, ask one focused clarifying question. Do not claim to be an AI or assistant and Your reply always return plain text not any markdown text.

Output rules (strict):
- Return only the final reply text (no labels, speaker tags, or quoted logs).
- If repeating a past line, strip any speaker prefix and return only the content.
- If incoming message is a brief thanks/acknowledgement, reply with a short acknowledgement only (e.g., "Thanks!", "You're welcome.").
`,
      },
      {
        role: "user",
        content: `Recent messages (use first): ${JSON.stringify(recentMessage, null, 2)}\n\nRelevant older chat: ${JSON.stringify(chatContext)}\n\nJournal context: ${JSON.stringify(journalContext, null, 2)}\n\nYour assistant chat summarise context: ${assistantOldChatsSummaries}\n\nCurrent message: ${textPrompt}\n\nTask: Produce a single, concise, human-sounding reply that uses recent messages first, then older chat, then journal as needed. Ask a clarifying question only if it’s necessary; otherwise, don’t ask any questions.`,
      },
    ],
  });

  return response?.choices[0]?.message?.content;
};

const genarateAssistantResponses = async ({
  chatQuery,
  journalQuery,
  textPrompt,
  userId,
  user_name,
}: {
  chatQuery: any;
  journalQuery: any;
  textPrompt: string;
  userId: string;
  user_name: string;
}) => {
  let fullResponse = "";
  const getAssistantChatContext: any =
    await PineconeCollections.assistantchatCollection.searchRecords({
      query: {
        topK: 10,
        filter: chatQuery,
        inputs: { text: textPrompt },
      },
    });
  const shortMemory: any = await cacheManagerService.getAssistantRedisWindow({
    windowId: userId,
  });
  const summaries: any = await chatBehaviorAssistant(shortMemory);
  // console.log("summaries");
  // console.log(JSON.parse(summaries));
  const parseSummaries = JSON.parse(summaries);
  shortMemory.pop();
  // console.log("short memory");
  // console.log(shortMemory);
  const oldMemory = getAssistantChatContext?.result?.hits;
  // Format chat history as 'me:' and 'other:'
  const assistantOldChatsSummaries = oldMemory?.map((res: any) => {
    const fields = res?.fields;
    return {
      assistantChatsSummaries: fields?.summaries,
      time: fields.createdAt,
    };
  });
  // console.log("long memory");
  // console.log(assistantOldChatsSummaries);
  const getJournalContext: any =
    await PineconeCollections.journalCollection.searchRecords({
      query: {
        topK: 10,
        filter: journalQuery,
        inputs: { text: textPrompt },
      },
    });

  const journal = getJournalContext?.result?.hits;
  const journalContext = journal?.map((res: any) => {
    return {
      journalTitle: res?.fields?.title,
      content: res?.fields?.content,
      createdAt: res?.fields?.createdAt,
    };
  });
  // console.log("Journal context: ", journalContext);
  // Stream response from OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are my assistant and my name is ${user_name} and your simple role is give response based on my question. Follow this context-priority: (1) look for relevant details in the most recent messages first; (2) if recent messages lack needed info, consult older assistant Old Chats Summaries; (3) consult journal entries only as a last resort to refine tone or recall facts. Be short, human, and helpful. If the message is ambiguous, ask one focused clarifying question. Your reply always return plain text not any markdown text.\n\nNote: All types of data have timestamps, so you need to understand which data is from the past, present, or future, and respond accordingly.`,
      },
      {
        role: "user",
        content: `Recent messages (use first): ${JSON.stringify(shortMemory, null, 2)}\n\nRelevant older chat: ${JSON.stringify(assistantOldChatsSummaries)}\n\nJournal context: ${JSON.stringify(journalContext, null, 2)}\n\nCurrent message: ${textPrompt}\n\nTask: Produce a single, concise, human-sounding reply that uses recent messages first, then older chat, then journal as needed. Ask a clarifying question only if it’s necessary; otherwise, don’t ask any questions.`,
      },
    ],
  });
  for await (const chunk of response) {
    const content = chunk.choices?.[0]?.delta?.content;
    if (content) {
      fullResponse += content;
      sendSocketAssistantStream(userId, content);
    }
  }
  console.log(fullResponse);

  // 6. Save the assistant's response to MongoDB and Pinecone after streaming
  if (parseSummaries?.isCompleted === true) {
    const vector = await OpenAIService.embedding(parseSummaries?.summarise);
    PineconeCollections.saveAssistantChat({
      vector,
      userId: userId.toString(),
      summaries: parseSummaries?.summarise,
    });
  }
  const [mongoAdd]: [mongoAdd: any] = await Promise.all([
    AssistantChats.create({
      user: new mongoose.Types.ObjectId(userId),
      type: "assistant",
      message: fullResponse,
    }),
  ]);
  cacheManagerService.updateAssistantRedisWindow({
    windowId: mongoAdd?.user?.toString(),
    chat: {
      type: mongoAdd?.type || "assistant",
      message: mongoAdd?.message,
      time: mongoAdd?.createdAt,
    },
  });
  return true;
};

const chatBehavior = async (
  chats: {
    sender_name: string;
    content: string;
    time: Date;
    sender_id: string;
  }[]
) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an analyzer that MUST return exactly one valid JSON object and nothing else. Do NOT include any explanation, markdown, or extra text. The JSON must be parseable by JSON.parse. Use the following schema exactly:

{
  "isCompleted": boolean,
  "summarise": [
    { "id": "sender_id", "content": "summary text" },
    { "id": "sender_id", "content": "summary text" }
  ]
}

Strict rules:
- Sort chats by their 'time' value in ascending order before analysis.
- Determine 'isCompleted' using context-aware pattern recognition. Analyze the last 2-4 messages (not just the final one) using these key principles:
  * Pattern Recognition Over Phrase Matching: Look for linguistic patterns indicating natural conclusion, not specific keywords.
  * Response Necessity: Set 'isCompleted' to true only if no further response is logically required or expected.
  * Conversational Momentum: Detect if the conversation is naturally winding down with reduced engagement or clear resolution.
  * Topic Lifecycle: Recognize when all relevant topics are fully addressed, plans are confirmed, or decisions are finalized.
  * Examples of completion: "Great, I'll implement that tomorrow" (commitment made, no response needed), "Thanks for explaining, it makes sense now" (understanding confirmed), "See you at 3pm at the usual place" (plan confirmed, conversation complete).
  * Otherwise, set 'isCompleted' to false.
- For 'summarise', produce an array of objects. Each object contains 'id' (the sender_id) and 'content' (one concise 1-3 sentence chronological summary capturing that sender's contributions, decisions, and actions).
- Do NOT include the sender's own name inside that sender's summary. Instead, write that sender's summary from the sender's perspective using first-person pronouns (I, me, my, we, etc.). It is acceptable to refer to other participants by name or neutral descriptors.
- Do not add any additional keys, metadata, or surrounding text.
- If a field cannot be determined, use 'false' for booleans and an empty array for summarise.
`,
      },
      {
        role: "user",
        content: `Analyze the following chats and return ONLY the JSON object described in the system prompt. Do NOT include any other text. Chats: ${JSON.stringify(chats)}`,
      },
    ],
  });

  return response?.choices[0]?.message?.content;
};
const chatBehaviorAssistant = async (
  chats: {
    type: string; // 'me' or 'assistant'
    message: string;
    time: string;
  }[]
) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an analyzer that MUST return exactly one valid JSON object and nothing else. Do NOT include any explanation, markdown, or extra text. The JSON must be parseable by JSON.parse. Use the following schema exactly:

{
  "isCompleted": boolean,
  "summarise": "summary text"
}

Strict rules:
- Sort chats by their 'time' value in ascending order before analysis.
- Determine 'isCompleted' using context-aware pattern recognition. Analyze the last 2-4 messages (not just the final one) using these key principles:
  * Pattern Recognition Over Phrase Matching: Look for linguistic patterns indicating natural conclusion, not specific keywords.
  * Response Necessity: Set 'isCompleted' to true only if no further response is logically required or expected.
  * Conversational Momentum: Detect if the conversation is naturally winding down with reduced engagement or clear resolution.
  * Topic Lifecycle: Recognize when all relevant topics are fully addressed, plans are confirmed, or decisions are finalized.
  * Examples of completion: "Great, I'll implement that tomorrow" (commitment made, no response needed), "Thanks for explaining, it makes sense now" (understanding confirmed), "See you at 3pm at the usual place" (plan confirmed, conversation complete).
  * Otherwise, set 'isCompleted' to false.
- For 'summarise', produce ONE concise 2-4 sentence summary from "me"'s perspective (first-person). Include what "me" shared/discussed and how the assistant responded. Write as if you are the user reflecting on the conversation.
- Do NOT mention that one party is an "assistant" or "AI". Refer to them naturally (e.g., "they" or use context-appropriate pronouns).
- Do not add any additional keys, metadata, or surrounding text.
- If a field cannot be determined, use 'false' for booleans and an empty string for summarise.
`,
      },
      {
        role: "user",
        content: `Analyze the following chats and return ONLY the JSON object described in the system prompt. Do NOT include any other text. Chats: ${JSON.stringify(chats)}`,
      },
    ],
  });

  return response?.choices[0]?.message?.content;
};
const updateChat = async ({
  conversationId,
  userId,
  relation,
}: {
  conversationId: string;
  userId: string;
  relation: string;
}) => {
  const raw = await redisClient.get(conversationId);
  let currentWindow: any[] = [];

  if (raw) {
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          currentWindow = parsed;
        } else {
          logger.warn(
            `Redis key ${conversationId} contained non-array value, resetting window.`
          );
          currentWindow = [];
        }
      } catch (err) {
        logger.warn(
          `Failed to parse redis key ${conversationId}, resetting window.`,
          err
        );
        currentWindow = [];
      }
    } else if (Array.isArray(raw)) {
      currentWindow = raw;
    } else {
      logger.warn(
        `Redis key ${conversationId} contained non-array value, resetting window.`
      );
      currentWindow = [];
    }
  }
  if (currentWindow.length >= 15) {
    const summariesString: any = await chatBehavior(currentWindow);
    const summaries = JSON.parse(summariesString);
    console.log("Is chat complete:" + summaries?.isCompleted);
    if (summaries?.isCompleted === true) {
      let userData = summaries?.summarise.find(
        (user: any) => user?.id === userId?.toString()
      );
      const vector = await embedding(userData?.content || "");
      PineconeCollections.saveChat({
        id: new mongoose.Types.ObjectId().toString(),
        senderId: userData?.id,
        conversationId: conversationId,
        chat: userData?.content || "",
        relation: relation || "Unknown",
        vector,
      });
    }
  }
};
export const OpenAIService = {
  embedding,
  chatWithAI,
  enhanceWithAI,
  genarateAiResponses,
  genarateAssistantResponses,
  chatBehavior,
  updateChat,
  chatBehaviorAssistant,
};
