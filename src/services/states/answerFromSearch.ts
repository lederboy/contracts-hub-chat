import { OpenAIClient } from "@azure/openai";
import { AnswerQueryFromSearchPrompt, } from "../../prompts/formatSearchQuery";
import { AnswerFromSearchCallData, FinalizeCallData } from "./states";






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
    static async run(callData: AnswerFromSearchCallData, openaiClient: OpenAIClient, deployment: string): Promise<FinalizeCallData> {
        
        const completion = await openaiClient.getChatCompletions(
            deployment,
            [AnswerQueryFromSearchPrompt, {role: 'user', content: this.formatUserPrompt(callData.searchResponse, callData.query)}]
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