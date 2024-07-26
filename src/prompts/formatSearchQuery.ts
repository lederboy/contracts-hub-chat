import { ChatRequestSystemMessage } from "@azure/openai";




export const AnswerQueryFromSearchPrompt: ChatRequestSystemMessage = 
    {
        role: 'system',
        content: `
            You are given a prompt that has a query that you must answer and a mapping from contract name to contract content. You must use the contract content to answer the query. Finally, Output all text in markdown.
            Here is an example: 

            Query:
                What are termination conditions for CVS contracts?
            Mappings:
                CVS_2024 UHC Medicare Flu Vaccine Amendment_fully executed (1).pdf -> <content>
                CVS_2023 non-UHC Medicare Amendment_008, 039, 123, 177, 207, 608, 673, 782_CAF.pdf -> <content>
        `
    }
