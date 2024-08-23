import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ChatFeedbackSession } from "../definitions/exchange";
import { SessionManager } from "../services/session";
import { ContainerClient, StorageSharedKeyCredential } from "@azure/storage-blob";


export async function UserFeedback(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const sessionManager =  new SessionManager(
        new ContainerClient(
            process.env.BLOB_CONTAINER_URL!,
            new StorageSharedKeyCredential(
                process.env.STORAGE_ACCOUNT_NAME!,
                process.env.STORAGE_ACCOUNT_KEY!
            )
        )
    )
    

    const chatSesh = ChatFeedbackSession.parse(await request.json());
    let sessionId = chatSesh.sessionId;
    let user = chatSesh.user;
    let feedback = chatSesh.feedback;
    let chatOrder = chatSesh.chatOrder;
    const isdeleted = await sessionManager.defineFeedbackSession(user, sessionId, feedback, chatOrder)

    
    // await sessionManager.saveSession(user, callData.session)
    return {
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                feedback: isdeleted
            }
        )
    }

};

app.http('UserFeedback', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: UserFeedback
});
