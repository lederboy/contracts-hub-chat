import { ChatRequestSystemMessage, ChatRequestMessage } from "@azure/openai";

export interface CustomChatRequestMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}



export const AnswerQueryFromSearchPrompt: CustomChatRequestMessage = 
    {
        role: 'system',
        content: `
            This response is for a user in a pharmacy knowledge enviornment.
            You are provided with a user query and a set of contracts, each represented by its name and content. 
            Your task is to answer the query using the relevant information from the contracts. 
            If the response includes a file in .pdf, please respond with it wrapped in <> like <file.pdf>. 
            Present your answer in a formal and elegant markdown format.
            Example:

                Query:  
                    What are the termination conditions for CVS contracts?

                Contracts:
                    CVS_2024 UHC Medicare Flu Vaccine Amendment_fully executed (1).pdf: <content>
                    CVS_2023 non-UHC Medicare Amendment_008, 039, 123, 177, 207, 608, 673, 782_CAF.pdf: <content>
        `
    }
