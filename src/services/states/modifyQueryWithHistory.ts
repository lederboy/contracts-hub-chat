import { OpenAIClient } from "@azure/openai";
import { GetDocumentFromSummaryCallData, ModifyQueryCallData } from "./states";
import { ModifyQueryWithHistoryPrompt } from "../../prompts/modifyQuery";



export class ModifyQueryWithHistory {
    static async run(callData: ModifyQueryCallData, openaiClient: OpenAIClient, deployment: string): Promise<GetDocumentFromSummaryCallData> {
        if(callData.session.chatHistory.length == 0){
            return {
                state: 'GET_DOCUMENT_FROM_SUMMARY',
                session: callData.session,
                modifiedQuery: callData.query
            }
        }else{
            const completion = await openaiClient.getChatCompletions(
                deployment,
                [ModifyQueryWithHistoryPrompt, {role: 'user', content: callData.query}]
            )
            if(completion.choices.length > 0){
                let choice = completion.choices[0]
                if(choice.message){
                    let message = choice.message
                    if(message.content){
                        return {
                            state: 'GET_DOCUMENT_FROM_SUMMARY',
                            session: callData.session,
                            modifiedQuery: message.content
                        }
                    }
                }
            }
            throw Error('Error Completing Query')
               
        }
    }
}