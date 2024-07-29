import { OpenAIClient } from "@azure/openai";
import { ModifyQueryCallData, ParseQueryCallData, SearchCallData } from "./states";
import { ModifyQueryWithHistoryPrompt } from "../../prompts/modifyQuery";
import { ChatSession } from "../session";



export class ModifyQueryWithHistory {
    static formatUser(query:string, session: ChatSession): string {
        return `
        context:
            ${JSON.stringify(session.chatHistory)}
        query:
            ${query}
            
        `
    }
    static async run(callData: ModifyQueryCallData, openaiClient: OpenAIClient, deployment: string): Promise<SearchCallData | ParseQueryCallData> {
        if(callData.session.documents.length > 0){
            const completion = await openaiClient.getChatCompletions(
                deployment,
                [ModifyQueryWithHistoryPrompt, {role: 'user', content: this.formatUser(callData.query, callData.session)}]
            )
            if(completion.choices.length > 0){
                let choice = completion.choices[0]
                if(choice.message){
                    let message = choice.message
                    if(message.content){
                        return {
                            state: 'SEARCH',
                            session: callData.session,
                            documents: callData.session.documents,
                            query: message.content
                        }
                    }
                }
            }
        }else{
            return {
                state: "PARSE_SEARCH_QUERY",
                query: callData.query,
                session: callData.session
            }
        }
        
        throw Error('Error Completing Query')
            
    }
}