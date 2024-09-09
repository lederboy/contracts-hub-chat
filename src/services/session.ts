import { FilterQuery } from './../prompts/searchQuery';
import { ContainerClient } from "@azure/storage-blob";


export interface ChatHistory {
    role: string
    content: string
}
export interface ChatSession {
    sessionId: string
    chatHistory: ChatHistory[]
    documents: string[]
}

export interface HistoricalQuieries {
    content: string
    direction: string
    documents?: string[],
    chatOrder: number
}

export interface ChatHistory_AI {
    sessionId: string
    title: string
    chatHistory: HistoricalQuieries[]
}

export interface ChatSession_AI {
    user: string
    conversations: ChatHistory_AI[]
}

export class SessionManager {
    sessionPrefix: string = 'sessions'
    containerClient: ContainerClient
    constructor(containerClient: ContainerClient){
        this.containerClient = containerClient
    }
    async loadSession(user: string, sessionId: string, documentNames?: string[]): Promise<ChatHistory_AI>{
        const blobClient = this.containerClient.getBlobClient(`${this.sessionPrefix}/${user}.json`)
        if(await blobClient.exists()){
            const sessionStr = (await blobClient.downloadToBuffer()).toString()
            let json_session = JSON.parse(sessionStr)
            if (!sessionId){
                return json_session.conversations.map((entry: { sessionId: any; title: any; }) => ({
                    sessionId: entry.sessionId,
                    title: entry.title,
                    chatHistory: []
                  }));
            }
            let session = json_session.conversations.find((conv: { sessionId: any; }) => conv.sessionId === sessionId);

            if (session) {
                session.chatHistory.forEach((chat: { chatOrder: any; }, index: any) => {
                    if (chat.chatOrder === undefined) {
                        chat.chatOrder = index;
                      }
                  });
                return session
            }else{
                return {
                    sessionId : sessionId,
                    title: '',
                    chatHistory: []
                }
            }
            
        }
        return {
                sessionId : sessionId,
                title: '',
                chatHistory: []
            }

        
    }
    async deleteSession(user: string, sessionId: string){
        const blobClient = this.containerClient.getBlockBlobClient(`${this.sessionPrefix}/${user}.json`)
        if(await blobClient.exists()){
            const sessionStr = (await blobClient.downloadToBuffer()).toString()
            let json_session = JSON.parse(sessionStr)
            json_session.conversations = json_session.conversations.filter(
                (conversation: { sessionId: string; }) => conversation.sessionId !== sessionId);
            const updatedContent = JSON.stringify(json_session);
            await blobClient.upload(updatedContent, Buffer.byteLength(updatedContent));
            return true
            
        }
        return false
    }

    async defineFeedbackSession(user: string, sessionId: string, feedback: boolean, chatorder: number, comment?: string){
        let feedback_array;
        const blobClient = this.containerClient.getBlockBlobClient(`${this.sessionPrefix}/${user}.json`);
        let type_feedback = "Negative";
        let blobClient_feedback = this.containerClient.getBlockBlobClient(`feedback/feedback.json`);
        if (feedback){
            type_feedback = "Positive";          
        }

        if(await blobClient_feedback.exists()){
            const sessionStr = (await blobClient_feedback.downloadToBuffer()).toString();
            feedback_array = JSON.parse(sessionStr);
            
        }else {
            feedback_array = {
                "Positive" : [],
                "Negative" : []
            };
            // await blobClient_feedback.upload(chatStr, chatStr.length)
        }
        

        if(await blobClient.exists()){
            const sessionStr = (await blobClient.downloadToBuffer()).toString()
            let json_session = JSON.parse(sessionStr)
            let conversation = json_session.conversations.find(
                (conversation: { sessionId: string; }) => conversation.sessionId === sessionId);
            let chat = conversation.chatHistory.find(
                (chat: { chatOrder: number; }) => chat.chatOrder === chatorder);
            chat.feedback = feedback;
            const updatedContent_history = JSON.stringify(json_session);
            await blobClient.upload(updatedContent_history, Buffer.byteLength(updatedContent_history));
            if (comment) {
                chat.comments = comment;
            }
            chat.user = user;
            chat.sessionId = sessionId;
            feedback_array[type_feedback].push(chat)
            const feedbackContent = JSON.stringify(feedback_array);
            await blobClient_feedback.upload(feedbackContent, Buffer.byteLength(feedbackContent));
            // return true
            // const updatedSessionStr = JSON.stringify(json_session);
            return true;
            
        }
        return false
    }
    async saveSession(user: string, session: ChatHistory_AI) {
        let userSession;
        const blobClient = this.containerClient.getBlockBlobClient(`${this.sessionPrefix}/${user}.json`)
        if(await blobClient.exists()){
            const sessionStr = (await blobClient.downloadToBuffer()).toString()
            userSession = JSON.parse(sessionStr)
            
        }else {
            userSession = {
                user: user,
                conversations: []
              };
            // await blobClient.upload(chatStr, chatStr.length)
        }
        let conversation = userSession.conversations.find((conv: { sessionId: any; }) => conv.sessionId === session.sessionId);
        
        if (!conversation) {
            userSession.conversations.push(session);
        }else{
            // conversation.chatHistory.push(...session.chatHistory.slice(Math.max(session.chatHistory.length - 2, 0)));
            conversation.chatHistory= session.chatHistory;
        }
        const updatedContent = JSON.stringify(userSession);
        await blobClient.upload(updatedContent, Buffer.byteLength(updatedContent));
        
    }
}