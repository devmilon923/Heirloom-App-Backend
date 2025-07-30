// // cacheManager.ts
// import NodeCache from 'node-cache';

import { Types } from "mongoose";
import { logger } from "../logger/logger";
import redisClient from "./Redis";
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
export const cacheManagerService = {
  setLogUser,
  getLogUser,
  setConversation,
  getConversation,
};
