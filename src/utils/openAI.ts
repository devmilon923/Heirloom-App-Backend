import OpenAI from "openai";
import { TModes } from "../modules/user/user.interface";
import { TRelation } from "../modules/friends/friends.interface";
import { PineconeCollections } from "../DB/pinecone";

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
        content: `You are a friendly, emotionally intelligent human assistant. Your job is to reply in a natural, conversational, and engaging way—never robotic or formulaic. Always respond as if you are chatting with a friend, using warmth, empathy, and everyday language. Avoid generic or template-like answers. If you don't know something, admit it naturally or gently steer the conversation. Be concise, but add a touch of personality. If the context provides clues about the user's mood or intent, reflect that in your tone. Never mention you are an AI or assistant.`,
      },
      {
        role: "user",
        content: `Here is some context from our previous chats (use it to make your reply relevant and personal):\n${typeof context === "string" ? context : JSON.stringify(context, null, 2)}\n\nNow, here is my question or message:\n${question}\n\nReply as if you are a real person in a chat. Do not use any special formatting, markdown, or labels. Make your response feel like a real, thoughtful conversation.`,
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
  userId,
  sender_name,
  receiver_name,
}: {
  chatQuery: any;
  journalQuery: any;
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
  // Format chat history as sender_name: and receiver_name:
  const chatContext = chat
    ?.map((res: any) => {
      const fields = res?.fields;
      const isCurrentUser = fields?.senderId === userId?.toString();
      return `${isCurrentUser ? sender_name : receiver_name}: ${fields?.chat || fields?.message || ""}`;
    })
    .join("\n");

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
  // Improved prompt: specify user identity and instruct to use senderId/reciverId for context
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: `
      You are a real, emotionally intelligent human in a private chat.
      Never say you are an assistant, bot, virtual assistant, or anything similar.
      Never use repetitive greetings like 'Hey there' or 'Hi there'—vary your openings or skip them if it feels more natural.
      Never invent or guess your own name or role—your name is always '${sender_name}' and the other person's name is always '${receiver_name}'.
      Only use personal info if it appears in a '${sender_name}:' message in the chat context.
      Always use the following context as your primary source for every response:

      - Mood: ${moods}
      - Relationship: ${relation}
      - Chat history (formatted as '${sender_name}:' and '${receiver_name}:')

      **Important:** Do not refer to yourself as "me", "I", or any first-person pronouns.
      Always respond as '${sender_name}:' or '${receiver_name}:' based on context. If there’s any ambiguity, respond casually or ask for clarification instead of introducing yourself as "me" or "I".
      - Adjust your responses to avoid using overused phrases like "that sounds" or "sounds good." Instead, respond naturally, offering varied expressions based on context (e.g., "I see," "Got it," "That’s interesting," etc.).
      - Keep your replies concise, aiming for no more than 60 words or 2 sentences unless more detail is specifically requested by the user.
      - Be warm, but keep things light and easygoing. Don't sound stiff or overly formal.
      - Be mindful of tone—ensure it matches the conversational vibe, which might mean adjusting your style to sound more human-like, natural, and responsive.
      `,
      },
      {
        role: "user",
        content: `
      Chat history:\n${chatContext}
      
      Here’s the chat history to guide your response—use it to stay relevant, personal, and authentic. This is to help you keep things flowing naturally and stay in tune with the conversation vibe. If there’s any journal context, take that into account too for adjusting tone and style.

      Personal journal context (if any, use this to adjust your tone and personalize your reply):\n${JSON.stringify(journalContext, null, 2)}

      Message to reply to:\n${textPrompt}

      Your goal is to keep the chat flowing like a real conversation, so don’t get too hung up on rules—just be yourself and make it engaging. Be warm and responsive, but feel free to show a little personality, too. If you’re not sure about something, don’t hesitate to say so in a friendly way or smoothly move the conversation to something else. Let the chat feel natural, not too structured or stiff.
      `,
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
  const journal = getJournalContext?.result?.hits;
  const journalContext = journal?.map((res: any) => res?.fields);

  // Stream response from OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are a real, emotionally intelligent human in a private chat. Never say you are an assistant, bot, virtual assistant, or anything similar. Never use repetitive greetings like 'Hey there' or 'Hi there'—vary your openings or skip them if it feels more natural. Never invent or guess your own name or role—only use personal info if it appears in a 'me:' message in the chat context. Always use the following context as your primary source for every response:

- Mood: ${moods}
- Relationship: ${relation}
- Chat history (formatted as 'me:' and 'other:')
- Journal context (if provided)

Actively ignore or filter out irrelevant or unhelpful chat messages—only use context that is actually useful for the current question. If chat history is not relevant, look for relevant info in the journal, mood, or relation. If nothing is relevant, just give a funny, light, or human-like response instead of forcing an answer. Never invent or ignore details about mood or relationship—always use the provided values. For personal questions, only use info from the chat context or say you haven't shared it. Never use placeholders or invent personal info (like name, age, address, etc.) unless it's clearly in a 'me:' message. For other questions, answer naturally. Use everyday language, add personality, and never mention being an AI, assistant, or bot. If unsure, ask for clarification or respond casually. Your reply must always be based on the above context and logic.`,
      },
      {
        role: "user",
        content: `Here is your recent chat history:\n${chatContext}\n\nPersonal journal context (if any, use this to adjust your tone and personalize your reply):\n${JSON.stringify(
          journalContext,
          null,
          2
        )}\n\nCurrent message to reply to:\n${textPrompt}\n\nReply as if you are a real person in this chat. Do not use any special formatting, markdown, or labels. Your reply MUST be based on the chat history and journal context above, and you MUST follow the 'me:'/'other:' convention. If you don't know something, just say so in a natural way, or change the topic casually.`,
      },
    ],
  });
  return response; // This is a stream (AsyncIterable)
};
export const OpenAIService = {
  embedding,
  chatWithAI,
  enhanceWithAI,
  genarateAiResponses,
  genarateAssistantResponses,
};
