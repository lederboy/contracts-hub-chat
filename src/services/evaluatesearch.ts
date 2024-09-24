import { OpenAIClient } from "@azure/openai";
import { DefineQueryTitleCallData,   DefineResponseCallData} from "./states/states";
import { CustomChatEvaluateResponse } from "../prompts/evaluatesearch";

import { EvaluateSearchResponse } from "../prompts/evaluatesearch";
import { ChatHistory_AI } from "./session";
import { encode } from 'gpt-3-encoder';


function isTokenCountExceedingLimit(text: string, limit: number = 4096): boolean {
    const tokens = encode(text);
    return tokens.length > limit;
}  

export class EvaluateSearch {
    static formatUser(information: string, query:string): string {
        return `
        Based on the provided information, determine whether the information can answer the given query. Respond only with "true" if the provided information can answer the query, otherwise respond with "false."
        Provided Information:
            ${information}
        Provided Query:
            ${query}
        `
    }
    static async run(information: string, query:string, openaiClient: OpenAIClient, deployment: string): Promise<boolean> {
        const response_ = this.formatUser(information, query);
        const tokenLimit = 4096;
        const isExceeding = isTokenCountExceedingLimit(response_, tokenLimit);
        let prompt_chat: CustomChatEvaluateResponse[] = [EvaluateSearchResponse];
        if (isExceeding) {
            deployment = 'gpt-4';
        }else{
            deployment = 'gpt-35-turbo';
        }
        console.log(deployment)
        const completion = await openaiClient.getChatCompletions(
            deployment,
            prompt_chat.concat([{role: 'user', content: response_}]),
            {temperature: 0.0}
        )
        
        // const completion = await openaiClient.getChatCompletions(
        //     'gpt-35-turbo',
        //     [EvaluateSearchResponse, {role: 'user', content: this.formatUser(information, query)}],
        //     {temperature: 0.1}
        // )
        if(completion.choices.length > 0){
            let choice = completion.choices[0]
            if(choice.message){
                let message = choice.message
                if(message.content){
                    return message.content.trim().toLowerCase() === 'true'
                }
            }
        }
        throw Error('Error Completing Query')
            
    }
}