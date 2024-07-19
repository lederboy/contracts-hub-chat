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

export class SessionManager {
    sessionPrefix: string = 'sessions'
    containerClient: ContainerClient
    constructor(containerClient: ContainerClient){
        this.containerClient = containerClient
    }
    async loadSession(sessionId: string): Promise<ChatSession>{
        const blobClient = this.containerClient.getBlobClient(`${this.sessionPrefix}/${sessionId}.json`)
        if(await blobClient.exists()){
            const sessionStr = (await blobClient.downloadToBuffer()).toString()
            return JSON.parse(sessionStr)
        }else {
            return {
                sessionId: sessionId,
                chatHistory: [],
                documents: []
            }
        }
    }
    async saveSession(session: ChatSession) {
        const chatStr = JSON.stringify(session)
        const blobClient = this.containerClient.getBlockBlobClient(`${this.sessionPrefix}/${session.sessionId}.json`)
        await blobClient.upload(chatStr, chatStr.length)
    }
}