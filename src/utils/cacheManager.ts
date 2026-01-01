// // cacheManager.ts
// import NodeCache from 'node-cache';

import mongoose, { Types } from "mongoose";
import { logger } from "../logger/logger";
import redisClient from "./Redis";
import { OpenAIService } from "./openAI";
import { PineconeCollections } from "../DB/pinecone";
const setLogUser = async (data: any) => {
  redisClient.set("user", data);
};
const getLogUser = async () => {
  return redisClient.get("user");
};

const getConversation = async ({
  conversationId,
}: {
  conversationId: Types.ObjectId;
}) => {
  const result = await redisClient.get(`conversation-${conversationId}`);
  return result ? JSON.parse(result) : null;
};
const setConversation = async ({
  conversationId,
  data,
}: {
  conversationId: Types.ObjectId;
  data: any;
}) => {
  await redisClient.set(`conversation-${conversationId}`, JSON.stringify(data));
};

// {
//               sender_name: result?.message?.reciver?.name || "Unknown",
//               sender_id: receiverId,
//               content: reply || "",
// }
const addMessageInRedisWindow = async ({
  windowId,
  chat,
}: {
  windowId: string;
  chat: {
    sender_name: string;
    sender_id: string;
    content: string;
    relation: string;
  };
}) => {
  try {
    const raw = await redisClient.get(windowId);
    let currentWindow: any[] = [];

    if (raw) {
      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            currentWindow = parsed;
          } else {
            logger.warn(
              `Redis key ${windowId} contained non-array value, resetting window.`
            );
            currentWindow = [];
          }
        } catch (err) {
          logger.warn(
            `Failed to parse redis key ${windowId}, resetting window.`,
            err
          );
          currentWindow = [];
        }
      } else if (Array.isArray(raw)) {
        currentWindow = raw;
      } else {
        logger.warn(
          `Redis key ${windowId} contained non-array value, resetting window.`
        );
        currentWindow = [];
      }
    }

    currentWindow.push({ ...chat, time: new Date() });
    if (currentWindow.length > 15) {
      currentWindow.shift();
    }
    await redisClient.set(windowId, JSON.stringify(currentWindow));
  } catch (err) {
    logger.error(`addMessageInRedisWindow failed for window ${windowId}`, err);
  }
};
const getUserRedisMessageWindow = async ({
  windowId,
}: {
  windowId: string;
}) => {
  const raw = await redisClient.get(windowId);
  let currentWindow: any[] = [];
  if (raw) {
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          currentWindow = parsed;
        } else {
          logger.warn(
            `Redis key ${windowId} contained non-array value, resetting window.`
          );
          currentWindow = [];
        }
      } catch (err) {
        logger.warn(
          `Failed to parse redis key ${windowId}, resetting window.`,
          err
        );
        currentWindow = [];
      }
    } else if (Array.isArray(raw)) {
      currentWindow = raw;
    } else {
      logger.warn(
        `Redis key ${windowId} contained non-array value, resetting window.`
      );
      currentWindow = [];
    }
  }
  return currentWindow?.map(
    (chat: {
      sender_name: string;
      sender_id: string;
      content: string;
      time?: Date;
    }) => {
      return { [chat.sender_name]: chat.content || "", time: chat?.time };
    }
  );
};
export const cacheManagerService = {
  setLogUser,
  getLogUser,
  setConversation,
  getConversation,
  addMessageInRedisWindow,
  getUserRedisMessageWindow,
};
