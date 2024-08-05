import { OpenAIClient } from "@azure/openai";
import { AnswerQueryFromSearchPrompt, } from "../../prompts/formatSearchQuery";
import { AnswerFromSearchCallData, AnswerFromSearchCallDataIndex, FinalizeCallData } from "./states";
import { encode } from 'gpt-3-encoder';

function isTokenCountExceedingLimit(text: string, limit: number = 4096): boolean {
    const tokens = encode(text);
    return tokens.length > limit;
}



export class AnswerQueryFromSearch {
    static formatUserPrompt(mapping: Record<string, string>, query: string): string {
        let mappingStrings = Object.keys(mapping).map((k) => `${k} -> ${mapping[k]}`)
        return `
        Query:
            ${query}
        Mappings:
            ${mappingStrings.join('\n')}
        
        `
    }
    static async run(callData: AnswerFromSearchCallData, openaiClient: OpenAIClient, deployment: string, overrideDeployment: boolean = false): Promise<FinalizeCallData> {
        const response_ = this.formatUserPrompt(callData.searchResponse, callData.query)
        const tokenLimit = 4096;
        const isExceeding = isTokenCountExceedingLimit(response_, tokenLimit);
        
        if (overrideDeployment && isExceeding) {
            deployment = 'gpt-4o';
        }else{
            deployment = 'gpt-35-turbo';
        }
        console.log(deployment)
        const completion = await openaiClient.getChatCompletions(
            deployment,
            [AnswerQueryFromSearchPrompt, {role: 'user', content: response_}],
            {temperature: 0.0}
        )

        if(completion.choices.length > 0){
           let choice = completion.choices[0]
           if(choice.message){
            let message = choice.message
            if(message.content){
                return {
                    state: 'FINALIZE',
                    session: callData.session,
                    documents: callData.documents,
                    query: callData.query,
                    llmResponse: message.content
                }
            }
           }
        }
        throw Error('Error Completing Query')
    }
}