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

export class LLMSectionCompare {
    static SectionNameExtraction(CompareInformation: string, definitionInformation:string): string {
        return `
        I want you to determine from the following list of sections provided from data definition:
            ${definitionInformation}
        compare which of the values from the data definition is closest to the following user selected section:
            ${CompareInformation}
        I want you to respond with only the section from the list of values in the data definition.
        For example, If the user selected section is "BER rates", I would want you to extract "Brand Effective Rates (BER)"
        `
    }
    static SectionComparisonAnalysis(CompareInformation: string, definitionInformation:string): string {
        return `
        I want you to determine from the following list of sections provided from data definition:
            ${definitionInformation}
        compare which of the values from the data definition is closest to the following user selected section:
            ${CompareInformation}
        I want you to respond with only the section from the list of values in the data definition.
        For example, If the user selected section is "BER rates", I would want you to extract "Brand Effective Rates (BER)"
        `
    }
    static async run(CompareInformation: string, definitionInformation:string, openaiClient: OpenAIClient, sectionExtract: boolean): Promise<boolean> {
        let response;
        let prompt_chat: CustomChatEvaluateResponse[];
        if (sectionExtract){
            response = this.SectionNameExtraction(CompareInformation, definitionInformation);
            prompt_chat = [EvaluateSearchResponse];

        }else{
            response = this.SectionComparisonAnalysis(CompareInformation, definitionInformation);
            prompt_chat = [EvaluateSearchResponse];
        }
        
        const tokenLimit = 4096;
        const isExceeding = isTokenCountExceedingLimit(response, tokenLimit);
        
        let deployment;
        if (isExceeding) {
            deployment = 'gpt-4';
        }else{
            deployment = 'gpt-35-turbo';
        }
        console.log(deployment)
        const completion = await openaiClient.getChatCompletions(
            deployment,
            prompt_chat.concat([{role: 'user', content: response}]),
            {temperature: 0.0}
        )        
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