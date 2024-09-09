import { ChatRequestMessageUnion, ChatRequestSystemMessage } from "@azure/openai";


export const DefineTitlteForQuery: ChatRequestSystemMessage = 
    {
        role: 'system',
        content: `
        You are going to act as an expert title summarizer. 
        Your task is to based on the provided query, create a short, detailed and concise, 3-5 word title, avoiding the use of the word 'title'. 
        Do not use any formatting. Do not use the word title.
        `
    }
