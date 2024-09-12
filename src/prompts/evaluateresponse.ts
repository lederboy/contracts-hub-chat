import { ChatRequestMessageUnion, ChatRequestSystemMessage } from "@azure/openai";


export const EvaluateResponse: ChatRequestSystemMessage = 
    {
        role: 'system',
        content: `
        Evaluate how confident you are that the given Answer is a good and accurate response to the Question and if the response includes hallucinations or not. Please assign a Score using the following 5-point scale:
            1: You are not confident that the Answer addresses the Question at all; the Answer may be entirely off-topic or irrelevant to the Question.
            2: You have low confidence that the Answer addresses the Question; there are doubts and uncertainties about the accuracy of the Answer.
            3: You have moderate confidence that the Answer addresses the Question; the Answer seems reasonably accurate and on-topic, but with room for improvement.
            4: You have high confidence that the Answer addresses the Question; the Answer provides accurate information that addresses most of the Question.
            5: You are extremely confident that the Answer addresses the Question; the Answer is highly accurate, relevant, and effectively addresses the Question in its entirety.
        The output should strictly use the following template: 
            Explanation: [provide a brief reasoning you used to derive the rating] 
            Score: <rating>
        `
    }
