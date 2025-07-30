import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import { PineconeCollections } from "../../DB/pinecone";
import { OpenAIService } from "../../utils/openAI";

const enhanceJournal = async (content: string) => {
  // Create the streaming completion request
  const response = await OpenAIService.enhanceWithAI(content);
  let fullResponse = "";
  // Read the stream asynchronously
  for await (const chunk of response) {
    const content = chunk.choices[0].delta?.content;
    if (content) {
      fullResponse += content;
      // Optional: you can send this chunk to frontend live here
      // e.g., via websocket or SSE
    }
  }

  return { reply: fullResponse };
};
const saveData = async (text: string) => {
  const vector = await OpenAIService.embedding(text);
  const journal = await PineconeCollections.saveJournal({
    vector: vector,
    text: text,
    title: "Dummy title",
    userId: "userId9384j9034",
  });
  const chat = await PineconeCollections.saveChat({
    vector,
    senderId: "senderIdasu4029342n",
    reciverId: "reciverId38792hnd093",
    chat: text,
    relation: "frined",
  });
  return { journal, chat };
};
const searchData = async (text: string) => {
  const vector = await OpenAIService.embedding(text);
  const results = await PineconeCollections.chatCollection.query({
    vector,
    topK: 3,
    includeMetadata: true,
  });
  const context = results?.matches?.map((res) => {
    return `title: ${res?.metadata?.title} and content is: ${res?.metadata?.content}`;
  });
  const response = await OpenAIService.chatWithAI(context, text);
  return response;
};
export const EnhanceWithAI = {
  enhanceJournal,
  saveData,
  searchData,
};
