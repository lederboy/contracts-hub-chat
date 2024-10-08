import { OpenAIClient } from "@azure/openai";
import { FinalizeCallData, NeedsMoreContextCallData } from "./states";
import { NeedsMoreContextQuery } from "../../prompts/needsMoreContextQuery";



export class NeedsMoreContext {
    static async run(callData: NeedsMoreContextCallData, openaiClient: OpenAIClient, deployment: string): Promise<FinalizeCallData> {
        const completion = await openaiClient.getChatCompletions(
            'gpt-35-turbo',
            [NeedsMoreContextQuery, {role: 'user', content: callData.query}],
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
                     documents: [],
                     query: callData.query,
                     llmResponse: message.content,
                     score: "0",
                     explanation: "The LLM needs more context"
                 }
             }
            }
         }
         throw Error('Unable to finish completion')
    }
}