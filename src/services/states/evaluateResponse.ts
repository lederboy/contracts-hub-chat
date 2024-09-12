import { OpenAIClient } from "@azure/openai";
import { EvaluateCallData,   FinalizeCallData} from "./states";
import { EvaluateResponse } from "../../prompts/evaluateresponse";



export class EvaluateLLMResponse {
    static formatUser(query:string, response:string): string {
        return `
        Evaluate the following response from the Language Model (LLM) based on the given query and response. 
        Focus on the confindece of the response to the query asked and the existing of hallucinations. 
        The Rating Scale will be: 1-5
        Please assign a Score using the following 5-point scale: 
            1: You are not confident that the Answer addresses the Question at all, the Answer may be entirely off-topic or irrelevant to the Question. 
            2: You have low confidence that the Answer addresses the Question, there are doubts and uncertainties about the accuracy of the Answer.  
            3: You have moderate confidence that the Answer addresses the Question, the Answer seems reasonably accurate and on-topic, but with room for improvement. 
            4: You have high-confidence that the Answer addresses the Question., the Answer provides accurate information that addresses most of the Question.
            5: You are extremely confident that the Answer addresses the Question, the Answer is highly accurate, relevant, and effectively addresses the Question in its entirety. 
        Evaluate based on the provided query and the provided response:
        Provided query:
            ${query}
        Provided Response:
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
                    const explanationMatch = message.content.match(/Explanation: ([\s\S]*?)\n\n/);
                    const scoreMatch = message.content.match(/Score: (\d+)/);
                    const explanation = explanationMatch ? explanationMatch[1].trim() : '';
                    const score = scoreMatch ? scoreMatch[1] : '';
                    callData.session.title = message.content.replace(/"/g, '');
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