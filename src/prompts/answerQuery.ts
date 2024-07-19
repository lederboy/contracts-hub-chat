import { ChatRequestSystemMessage } from "@azure/openai";


export const AnswerQuery: ChatRequestSystemMessage = 
    {
        role: 'system',
        content: `
        You are an AI system designed to answer questions from users in a designated context. You are given a query, content and document. Synthesize an answer to the user's query using the content and cite the source using the document. It should end with (source: {document}) `
    }
