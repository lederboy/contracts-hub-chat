import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ChatHistorySession } from "../definitions/exchange";
import { SessionManager } from "../services/session";
import { ContainerClient, StorageSharedKeyCredential } from "@azure/storage-blob";


export async function DeleteChatHistory(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
    let contractType = chatSesh.contractType==undefined? 'pharmacy': chatSesh.contractType;
    const isdeleted = await sessionManager.deleteSession(user, sessionId, contractType)

    
    // await sessionManager.saveSession(user, callData.session)
    return {
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                deleted: isdeleted
            }
        )
    }

};

app.http('DeleteChatHistory', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: DeleteChatHistory
});
