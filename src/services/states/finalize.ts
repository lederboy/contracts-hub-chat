import { CompleteCallData, FinalizeCallData } from "./states";




export class Finalize {
    static run(callData: FinalizeCallData): CompleteCallData {
        let document_holder = []
        for(let document of callData.documents){
            document_holder.push(document)
            // if(!callData.session.chatHistory.documents.includes(document)){
            //     document_holder.push(document)
            // }
        }
       
        callData.session.chatHistory.push(
            {
                direction: 'outgoing',
                content: callData.query
            },
            {
                direction: 'incoming',
                content: callData.llmResponse,
                documents: document_holder
            }
        )
        return {
            state: 'COMPLETE',
            session: callData.session,
            llmResponse: callData.llmResponse
        }
    }
}