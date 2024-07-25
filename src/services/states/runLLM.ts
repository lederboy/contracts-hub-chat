import { OpenAIClient } from "@azure/openai";
import { RunLLMWithContentCallData, FinalizeCallData} from "./states";
import { AnswerQuery } from "../../prompts/answerQuery";
import { GetDocumentContent } from "./getContentByDocument";




export class RunLLMWithContent {
    static formatContentAndDocuments(content: any, document: string) {
        return `
        content:
            ${JSON.stringify(content)}
        source:
            ${document}
        `

    }
    static async run(callData: RunLLMWithContentCallData, openaiClient: OpenAIClient, deployment: string): Promise<FinalizeCallData> {
        let userPrompt = `
            query: ${callData.query}\n
        `
        for(let i = 0; i < callData.documents.length; i++){
            userPrompt += this.formatContentAndDocuments(callData.contents[i], callData.documents[i]) + '\n'
        }
        const completion = await openaiClient.getChatCompletions(
            deployment,
            [AnswerQuery, {role: 'user', content: userPrompt}]
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