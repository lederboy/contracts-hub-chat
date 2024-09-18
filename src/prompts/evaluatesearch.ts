import { ChatRequestMessageUnion, ChatRequestSystemMessage } from "@azure/openai";

export interface CustomChatEvaluateResponse {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export const EvaluateSearchResponse: ChatRequestSystemMessage = 
    {
        role: 'system',
        content: `
        You are going evaluate if the provided information will respond the provided query and respond with a true or a false.
        Your task is to determine if the information in the provided information is enough to respond the provided query.
        If the information is enough then you should respond with a true. Otherwise, you should respond with a false.
        `
    }
