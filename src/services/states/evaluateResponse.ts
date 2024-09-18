import { OpenAIClient } from "@azure/openai";
import { EvaluateCallData,   FinalizeCallData} from "./states";
import { EvaluateResponse } from "../../prompts/evaluateresponse";



export class EvaluateLLMResponse {
    static formatUser(query:string, response:string): string {
        return `
        Evaluate the following response from the Language Model (LLM) based on the given query and response. 
        Focus on whether the response responds the query and the existence of hallucinations. 
        The Rating Scale will be: 1-5
        Please assign a score using the following 5-point scale:
        1. Not confident that the answer responds to the question at all; it may be entirely off-topic or irrelevant, and the user cannot get their question answered. 
            Example: 
                Question: "What are the termination terms?" 
                Answer: "Based on the provided mappings, there is no specific information regarding the termination terms for the 2024 Part D_Caremark_FE contract. The available information in the mappings only includes additional provisions related to mail fulfillment for specialty drugs, conflict of terms, and the use of third parties to fulfill duties under the amendment. However, there is no mention of termination terms in the provided content. To obtain the termination terms for the 2024 Part D_Caremark_FE contract, it would be necessary to refer to the full contract document or any other relevant documents related to the contract."
                Explanation: The answer does not directly respond to the question and doesn't have enough information.
        2. Low confidence that the answer responds to the question; there are doubts and uncertainties about the accuracy of the answer, and it lacks sufficient detail to satisfactorily respond to the user's question.
        3. Moderate confidence that the answer responds to the question; the answer seems reasonably accurate and on-topic but has room for improvement and lacks sufficient details to fully respond to the user's question.
        4. Confident that the answer responds to the question; the answer provides accurate information that responds to most of the question with enough detail but lacks comprehensive coverage.
        5. Extremely confident that the answer responds to the question; the answer is highly accurate, relevant, and effectively responds to the question in its entirety with all necessary details, fully answering the user's question.
        You don't need the Answer to acknowledge the question only to respond it with the necesarry information
        Evaluate based on the provided query and the provided response:
        Provided Question:
            ${query}
        Provided Answer:
            ${response}
        The output should strictly use the following template: 
            Explanation: [provide a brief reasoning you used to derive the rating]
            Score: <rating>      
        `
    }
    static async run(callData: EvaluateCallData, openaiClient: OpenAIClient, deployment: string, overrideDeployment: boolean = false): Promise<FinalizeCallData> {
        const completion = await openaiClient.getChatCompletions(
            'gpt-35-turbo',
            [EvaluateResponse, {role: 'user', content: this.formatUser(callData.query, callData.llmResponse)}],
            {temperature: 0.0}
        )
        if(completion.choices.length > 0){
            let choice = completion.choices[0]
            if(choice.message){
                let message = choice.message
                if(message.content){
                    const explanationMatch = message.content.match(/Explanation:\s*(.+?)\s*Score:/s);
                    const scoreMatch = message.content.match(/Score:\s*(\d+)/);
                    const explanation = explanationMatch ? explanationMatch[1].trim() : '';
                    const score = scoreMatch ? scoreMatch[1] : '';
                    return {
                        state: 'FINALIZE',
                        session: callData.session,
                        documents: callData.documents,
                        query: callData.query,
                        llmResponse: callData.llmResponse,
                        score: score,
                        explanation: explanation
                    }
                }
            }
        }
        throw Error('Error Completing Query')
            
    }
}