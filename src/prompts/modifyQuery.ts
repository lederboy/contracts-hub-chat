import { ChatRequestMessageUnion, ChatRequestSystemMessage } from "@azure/openai";


export const ModifyQueryWithHistoryPrompt: ChatRequestSystemMessage = 
    {
        role: 'system',
        content: `Given the following conversation history and the users next question,rephrase the question to be a stand alone question. 
        If the conversation is irrelevant or empty, just restate the original question. 
        Do not add more details than necessary to the question`
    }
