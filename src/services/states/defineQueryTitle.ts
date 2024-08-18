import { OpenAIClient } from "@azure/openai";
import { DefineQueryTitleCallData,   SearchMetaDataCallData} from "./states";
import { DefineTitlteForQuery } from "../../prompts/definetitle";
import { ChatHistory_AI } from "../session";



export class DefineQueryTitle {
    static formatUser(query:string): string {
        return `
        Based on the provided query, create a concise and relevant title for the topic conversation that the user will engage in.
        query:
            ${query}
            
        `
    }
    static async run(callData: DefineQueryTitleCallData, openaiClient: OpenAIClient, deployment: string): Promise<SearchMetaDataCallData> {
        const completion = await openaiClient.getChatCompletions(
            'gpt-35-turbo',
            [DefineTitlteForQuery, {role: 'user', content: this.formatUser(callData.query)}],
            {temperature: 0.0}
        )
        if(completion.choices.length > 0){
            let choice = completion.choices[0]
            if(choice.message){
                let message = choice.message
                if(message.content){
                    callData.session.title = message.content
                    return {
                        state: 'SEARCH_WITH_METADATA',
                        session: callData.session,
                        query: callData.query
                    }
                }
            }
        }
        throw Error('Error Completing Query')
            
    }
}