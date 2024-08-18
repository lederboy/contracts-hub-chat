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
    documents?: string[]
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
                    title: entry.title
                  }));
            }
            let session = json_session.conversations.find((conv: { sessionId: any; }) => conv.sessionId === sessionId);
            if (session) {
                return session
            }
            
        }
        return {
            sessionId : sessionId,
            title: '',
            chatHistory: []

        }
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
            conversation.chatHistory.push(...session.chatHistory.slice(Math.max(session.chatHistory.length - 2, 0)));
        }
        const updatedContent = JSON.stringify(userSession);
        await blobClient.upload(updatedContent, Buffer.byteLength(updatedContent));
        
    }
}