import { OpenAIClient } from "@azure/openai";
import { DefineResponseCallData,   SearchMetaDataCallData, AnswerFromSearchCallDataIndex} from "./states";
import { DefineResponseForQuery } from "../../prompts/defineresponse";
import { ChatHistory_AI } from "../session";



export class DefineResponse {
    static formatUser(query:string): string {
        return `
        Based on the provided query, determine if the flow should be a generic response or if it requires a search with metadata. 
        Respond with either "GENERIC_RESPONSE" or "SEARCH_WITH_METADATA". 
        If the question can be answered without any context or metadata, then the question is "GENERIC_RESPONSE". 
        Otherwise, it is "SEARCH_WITH_METADATA". Some examples of the usage is

        For example:
            "What are the BER rates?" → "GENERIC_RESPONSE"
            "What is an expense fee?" → "GENERIC_RESPONSE"
            "List me all CVS contracts" → "SEARCH_WITH_METADATA"
            "What are the active status Walgreens contracts?" → "SEARCH_WITH_METADATA"
        Analyze the following query and decide if the question needs a "GENERIC_RESPONSE" or a "SEARCH_WITH_METADATA": 
        ${query}
            
        `
    }
    static async run(callData: DefineResponseCallData, openaiClient: OpenAIClient, deployment: string): Promise<SearchMetaDataCallData | AnswerFromSearchCallDataIndex> {
        const completion = await openaiClient.getChatCompletions(
            'gpt-35-turbo',
            [DefineResponseForQuery, {role: 'user', content: this.formatUser(callData.query)}],
            {temperature: 0.5}
        )
        if(completion.choices.length > 0){
            let choice = completion.choices[0]
            if(choice.message){
                let message = choice.message
                if(message.content){
                    const flow_state = message.content.replace(/"/g, '');
                    if (flow_state === 'SEARCH_WITH_METADATA'){
                        return {
                            state: 'SEARCH_WITH_METADATA',
                            session: callData.session,
                            query: callData.query
                        }

                    }else {
                        return {
                            state: "ANSWER_FROM_SEARCH",
                            searchResponse: '',
                            session: callData.session,
                            documents: [],
                            query: callData.query,
                            override: true
                        }
                    }
                    
                }
            }
        }
        throw Error('Error Completing Query')
            
    }
}