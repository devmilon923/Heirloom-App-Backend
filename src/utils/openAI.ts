import OpenAI from "openai";
import { TModes } from "../modules/user/user.interface";
import { TRelation } from "../modules/friends/friends.interface";
import { PineconeCollections } from "../DB/pinecone";
import redisClient from "./Redis";
import { logger } from "../logger/logger";
import mongoose from "mongoose";

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

  console.log("pinecon formatted chat =================");
  console.log(chatContext);
  const getJournalContext: any =
    await PineconeCollections.journalCollection.searchRecords({
      query: {
        topK: 5,
        filter: journalQuery,
        inputs: { text: textPrompt },
      },
    });
  const journal = getJournalContext?.result?.hits;
  const journalContext = journal?.map((res: any) => res?.fields);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a natural, emotionally-attuned conversational partner. Use mood (${moods}) and relationship (${relation}) to set tone. Follow this context-priority: (1) look for relevant details in the most recent messages first; (2) if recent messages lack needed info, consult older chat history; (3) consult journal entries only as a last resort to refine tone or recall facts. Be short, human, and helpful. If the message is ambiguous, ask one focused clarifying question. Do not claim to be an AI or assistant.

Output rules (strict):
- Return only the final reply text (no labels, speaker tags, or quoted logs).
- If repeating a past line, strip any speaker prefix and return only the content.
- If incoming message is a brief thanks/acknowledgement, reply with a short acknowledgement only (e.g., "Thanks!", "You're welcome.").
`,
      },
      {
        role: "user",
        content: `Recent messages (use first): ${JSON.stringify(recentMessage, null, 2)}\n\nRelevant older chat: ${JSON.stringify(chatContext)}\n\nJournal context: ${JSON.stringify(journalContext, null, 2)}\n\nCurrent message: ${textPrompt}\n\nTask: Produce a single, concise, human-sounding reply that uses recent messages first, then older chat, then journal as needed. Ask a clarifying question only if it’s necessary; otherwise, don’t ask any questions.`,
      },
    ],
  });

  return response?.choices[0]?.message?.content;
};

const genarateAssistantResponses = async ({
  chatQuery,
  journalQuery,
  textPrompt,
  moods,
  relation,
  userId,
}: {
  chatQuery: any;
  journalQuery: any;
  textPrompt: string;
  moods: TModes;
  relation: TRelation;
  userId: string;
}) => {
  const getChatContext: any =
    await PineconeCollections.chatCollection.searchRecords({
      query: {
        topK: 10,
        filter: chatQuery,
        inputs: { text: textPrompt },
      },
    });
  const chat = getChatContext?.result?.hits;
  // Format chat history as 'me:' and 'other:'
  const chatContext = chat
    ?.map((res: any) => {
      const fields = res?.fields;
      const isCurrentUser = fields?.senderId === userId;
      return `${isCurrentUser ? "me" : "other"}: ${fields?.message || ""}`;
    })
    .join("\n");
  const getJournalContext: any =
    await PineconeCollections.journalCollection.searchRecords({
      query: {
        topK: 10,
        filter: journalQuery,
        inputs: { text: textPrompt },
      },
    });
  console.log("Chat context: ", chatContext);
  const journal = getJournalContext?.result?.hits;
  const journalContext = journal?.map((res: any) => res?.fields);
  console.log("Journal context: ", journalContext);
  // Stream response from OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are a natural, emotionally-attuned conversational partner. Use mood (${moods}) and relationship (${relation}) to set tone. Prefer the most recent messages first for relevance. If recent messages don't provide the needed context, consult older chat history; use journal entries only as a final fallback to refine tone or recall facts.

IMPORTANT OUTPUT RULES (strict):
1) Return ONLY the reply text (the message body). Do NOT include any speaker labels, prefixes, or raw chat lines such as 'me:' or 'other:' or similar—no metadata, no quoted history.
2) If you would otherwise repeat or paraphrase a past chat line, REMOVE any leading speaker label and return only the message content. Example: convert "me: I am fine" or "Alex: I am fine" to "I am fine".
3) Never output any line that looks like a raw chat log. Specifically, avoid producing any output that begins with the pattern /^.*:\s/ (name followed by colon and space).

SIMPLE-THANKS RULE (strict):
If the incoming message is only an expression of thanks or short appreciation (case-insensitive match for words/phrases such as: "thanks", "thank you", "appreciate", "ok", "okay", "good", "nice", "great", "got it", "thanks a lot"), reply with a short acknowledgement only (examples: "Thanks!", "You're welcome.", "Glad to help.") and do NOT ask follow-up questions, continue the conversation, or add extra prompts.

Actively ignore or filter out irrelevant or unhelpful chat messages—only use context that is actually useful for the current question. Never invent or ignore details about mood or relationship—always use the provided values. For personal questions, only use info from the chat context or say you haven't shared it. Never use placeholders or invent personal info (like name, age, address, etc.) unless it's clearly in a 'me:' message. Use everyday language, add personality, and never mention being an AI, assistant, or bot. If unsure, ask for clarification or respond casually. Your reply must always be based on the above context and logic.`,
      },
      {
        role: "user",
        content: `Chat history (me/other):\n${chatContext}\n\nJournal context:\n${JSON.stringify(journalContext, null, 2)}\n\nCurrent message:\n${textPrompt}\n\nTask: Compose one concise, human-sounding reply. First use the most recent chat entries for context; if they lack relevant details, then consult older chat; use journal entries only if needed to refine tone or recall facts. Ask a single clarifying question only if necessary. Do not include labels or quoted logs.`,
      },
    ],
  });

  return response; // This is a stream (AsyncIterable)
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

Strict rules (apply ONLY for this chatBehavior function):
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
};
