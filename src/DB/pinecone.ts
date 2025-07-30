import { Pinecone } from "@pinecone-database/pinecone";
import { v4 as uuidv4 } from "uuid";
const pinecone = new Pinecone({
  apiKey:
    process.env.PINECONE_API ??
    (() => {
      throw new Error("PINECONE_API environment variable is not set");
    })(),
});

const journalCollection = pinecone.Index("journalindex");
const chatCollection = pinecone.Index("chatindex");
const assistantchatCollection = pinecone.Index("assistantchat");
type ChatData = {
  vector: number[];
  senderId: string;
  reciverId: string;
  chat: string | "";
  relation: string;
  id?: string;
};
const saveChat = async ({
  vector,
  senderId,
  reciverId,
  chat,
  relation,
  id,
}: ChatData) => {
  await chatCollection.upsert([
    {
      id: id ? id : uuidv4(),
      values: vector,
      metadata: {
        senderId: senderId?.toString(), // ensure string
        reciverId: reciverId?.toString(), // ensure string
        chat: chat,
        relation: relation,
        createdAt: new Date().toISOString(),
      },
    },
  ]);
};
type JournalData = {
  vector: number[];
  userId: string;
  text: string;
  title: string;
  id?: string;
};
const saveJournal = async ({
  vector,
  userId,
  text,
  title,
  id,
}: JournalData) => {
  await journalCollection.upsert([
    {
      id: id ? id : uuidv4(),
      values: vector,
      metadata: {
        userId: userId,
        content: text,
        title: title,
        createdAt: new Date().toISOString(),
      },
    },
  ]);
};

type TSaveAssistantChat = {
  vector: number[];
  userId: string;
  assistant_message: string;
  my_message: string;
  id?: string;
};
const saveAssistantChat = async ({
  vector,
  userId,
  assistant_message,
  my_message,
  id,
}: TSaveAssistantChat) => {
  await assistantchatCollection.upsert([
    {
      id: id ? id : uuidv4(),
      values: vector,
      metadata: {
        user: userId?.toString(), // ensure string
        assistant_message: assistant_message,
        my_message: my_message,
        createdAt: new Date().toISOString(),
      },
    },
  ]);
};
export const PineconeCollections = {
  journalCollection,
  chatCollection,
  saveChat,
  saveJournal,
  assistantchatCollection,
  saveAssistantChat,
};
