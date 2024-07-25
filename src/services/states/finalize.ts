import { CompleteCallData, FinalizeCallData } from "./states";




export class Finalize {
    static run(callData: FinalizeCallData): CompleteCallData {
        callData.session.documents.push(...callData.documents)
        callData.session.chatHistory.push(
            {
                role: 'user',
                content: callData.query
            },
            {
                role: 'assistant',
                content: callData.llmResponse
            }
        )
        return {
            state: 'COMPLETE',
            session: callData.session,
            llmResponse: callData.llmResponse
        }
    }
}