import { ChatHistory } from './../services/session';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ChatHistorySession } from "../definitions/exchange";
import { SessionManager } from "../services/session";
import { ContainerClient, StorageSharedKeyCredential } from "@azure/storage-blob";


export async function HistoricalChat(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const sessionManager = new SessionManager(
        new ContainerClient(
            process.env.BLOB_CONTAINER_URL!,
            new StorageSharedKeyCredential(
                process.env.STORAGE_ACCOUNT_NAME!,
                process.env.STORAGE_ACCOUNT_KEY!
            )
        )
    )

    const chatSesh = ChatHistorySession.parse(await request.json());
    let sessionId = chatSesh.sessionId;
    let user = chatSesh.user;
    let contract_type = chatSesh.contract_type==undefined? 'pharmacy': chatSesh.contract_type;
    // let sessionId = ''
    const session = await sessionManager.loadSession(user, sessionId, contract_type)
    if(!sessionId){
        return {
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    topicHistory: Array.isArray(session) ? session : [session]
                }
            )
        }
        
    }
    return {
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                chathistory: session.chatHistory
            }
        )
    }

};

app.http('HistoricalChat', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: HistoricalChat
});
