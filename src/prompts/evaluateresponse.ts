import { ChatRequestMessageUnion, ChatRequestSystemMessage } from "@azure/openai";


export const EvaluateResponse: ChatRequestSystemMessage = 
    {
        role: 'system',
        content: `
        Evaluate the confidence level that the given answer is a good and accurate response to the question, and determine if the response includes any hallucinations. Assign a score using the following 5-point scale:
            1. Not confident that the answer responds to the question at all; it may be entirely off-topic or irrelevant, and the user cannot get their question answered. 
                Example: 
                    Question: "What are the termination terms?" 
                    Answer: "Based on the provided mappings, there is no specific information regarding the termination terms for the 2024 Part D_Caremark_FE contract. The available information in the mappings only includes additional provisions related to mail fulfillment for specialty drugs, conflict of terms, and the use of third parties to fulfill duties under the amendment. However, there is no mention of termination terms in the provided content. To obtain the termination terms for the 2024 Part D_Caremark_FE contract, it would be necessary to refer to the full contract document or any other relevant documents related to the contract."
                    Explanation: The answer does not directly respond to the question and doesn't have enough information.
            2. Low confidence that the answer responds to the question; there are doubts and uncertainties about the accuracy of the answer, and it lacks sufficient detail to satisfactorily respond to the user's question.
            3. Moderate confidence that the answer responds to the question; the answer seems reasonably accurate and on-topic but has room for improvement and lacks sufficient details to fully respond to the user's question.
            4. Confident that the answer responds to the question; the answer provides accurate information that responds to most of the question with enough detail but lacks comprehensive coverage.
            5. Extremely confident that the answer responds to the question; the answer is highly accurate, relevant, and effectively responds to the question in its entirety with all necessary details, fully answering the user's question.
        If the answer appropriately responds to the question, it should receive a score of 4 or 5. If it does not respond to the question, it should receive a score of 1 or 2.
        
        Additional Context: 
        Consider the context of the question and the specific details provided in the answer. Ensure that the answer not only addresses the question but does so accurately and comprehensively. Be mindful of any potential hallucinations, which are responses that seem plausible but are not factually accurate or relevant to the question.
        
        The output should strictly use the following template:
        Explanation: [provide a brief reasoning you used to derive the rating]
        Score: <rating>
        `
    }
