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

export const EnhanceWithAI = {
  enhanceJournal,
};
