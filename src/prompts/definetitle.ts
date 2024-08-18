import { ChatRequestMessageUnion, ChatRequestSystemMessage } from "@azure/openai";


export const DefineTitlteForQuery: ChatRequestSystemMessage = 
    {
        role: 'system',
        content: `Based on the provided query, create a concise and relevant title for the topic conversation that the user will engage in.`
    }
