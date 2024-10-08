import { OpenAIClient } from "@azure/openai";
import { ModifyQueryCallData, ParseQueryCallData, SearchCallData } from "./states";
import { ModifyQueryWithHistoryPrompt } from "../../prompts/modifyQuery";
import { ChatHistory_AI } from "../session";



export class ModifyQueryWithHistory {
    static formatUser(query:string, session: ChatHistory_AI): string {
        return `
        context:
            ${JSON.stringify(session.chatHistory)}
        query:
            ${query}
            
        `
    }
    static async run(callData: ModifyQueryCallData, openaiClient: OpenAIClient, deployment: string): Promise<SearchCallData | ParseQueryCallData> {
        let doc_list = callData.session.chatHistory[callData.session.chatHistory.length - 1]?.documents ?? [];
        if(doc_list.length > 0){
            const completion = await openaiClient.getChatCompletions(
                'gpt-35-turbo',
                [ModifyQueryWithHistoryPrompt, {role: 'user', content: this.formatUser(callData.query, callData.session)}],
                {temperature: 0.0}
            )
            if(completion.choices.length > 0){
                let choice = completion.choices[0]
                if(choice.message){
                    let message = choice.message
                    if(message.content){
                        return {
                            state: 'SEARCH',
                            session: callData.session,
                            documents: doc_list,
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