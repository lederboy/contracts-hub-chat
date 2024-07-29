import { CompleteCallData, FinalizeCallData } from "./states";




export class Finalize {
    static run(callData: FinalizeCallData): CompleteCallData {
        for(let document of callData.documents){
            if(!callData.session.documents.includes(document)){
                callData.session.documents.push(document)
            }
        }
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