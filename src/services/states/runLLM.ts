import { OpenAIClient } from "@azure/openai";
import { RunLLMWithContentCallData, FinalizeCallData} from "./states";
import { AnswerQuery } from "../../prompts/answerQuery";




export class RunLLMWithContent {
    static formatContentAndDocuments(callData: RunLLMWithContentCallData) {
        const jsons: string[] = []
        for(let json of callData.content.jsons){
            jsons.push(JSON.stringify(json.document.content))
        }
        return `
        query:
            ${callData.query}
        content:
            ${jsons}
        source:
            ${callData.document}
        `

    }
    static async run(callData: RunLLMWithContentCallData, openaiClient: OpenAIClient, deployment: string): Promise<FinalizeCallData> {
    
        const completion = await openaiClient.getChatCompletions(
            deployment,
            [AnswerQuery, {role: 'user', content: this.formatContentAndDocuments(callData)}]
        )

        if(completion.choices.length > 0){
           let choice = completion.choices[0]
           if(choice.message){
            let message = choice.message
            if(message.content){
                return {
                    state: 'FINALIZE',
                    session: callData.session,
                    document: callData.document,
                    query: callData.query,
                    llmResponse: message.content
                }
            }
           }
        }
        throw Error('Error Completing Query')
    }
}