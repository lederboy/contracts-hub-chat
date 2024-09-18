import { OpenAIClient } from "@azure/openai";
import { DefineQueryTitleCallData,   DefineResponseCallData} from "./states";
import { DefineTitlteForQuery } from "../../prompts/definetitle";
import { ChatHistory_AI } from "../session";



export class DefineQueryTitle {
    static formatUser(query:string): string {
        return `
        Based on the provided query, create a short, and detailed title Only based on the provided query.
        Provided query:
            ${query}
            
        `
    }
    static async run(callData: DefineQueryTitleCallData, openaiClient: OpenAIClient, deployment: string): Promise<DefineResponseCallData> {
        const completion = await openaiClient.getChatCompletions(
            'gpt-35-turbo',
            [DefineTitlteForQuery, {role: 'user', content: this.formatUser(callData.query)}],
            {temperature: 0.5}
        )
        if(completion.choices.length > 0){
            let choice = completion.choices[0]
            if(choice.message){
                let message = choice.message
                if(message.content){
                    callData.session.title = message.content.replace(/"/g, '');
                    return {
                        state: 'DEFINE_RESPONSE_TYPE',
                        session: callData.session,
                        query: callData.query
                    }
                }
            }
        }
        throw Error('Error Completing Query')
            
    }
}