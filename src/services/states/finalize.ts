import { CompleteCallData, FinalizeCallData } from "./states";




export class Finalize {
    static run(callData: FinalizeCallData): CompleteCallData {
        let document_holder = []
        const lastChatOrder =  callData.session.chatHistory.length > 0 ?  callData.session.chatHistory[ callData.session.chatHistory.length - 1].chatOrder : -1;
        for(let document of callData.documents){
            document_holder.push(document)
            // if(!callData.session.chatHistory.documents.includes(document)){
            //     document_holder.push(document)
            // }
        }
       
        callData.session.chatHistory.push(
            {
                direction: 'outgoing',
                content: callData.query,
                chatOrder: lastChatOrder + 1


            },
            {
                direction: 'incoming',
                content: callData.llmResponse,
                documents: document_holder,
                chatOrder: lastChatOrder + 2,
                score: callData.score,
                explanation: callData.explanation
            }
        )
        return {
            state: 'COMPLETE',
            session: callData.session,
            llmResponse: callData.llmResponse,
            score: callData.score,
            explanation: callData.explanation
        }
    }
}