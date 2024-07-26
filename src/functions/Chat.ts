import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ChatSessionSchema } from "../definitions/exchange";
import {v4 as uuidv4} from 'uuid';
import { SessionManager } from "../services/session";
import { ContainerClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { CallData } from "../services/states/states";
import { initWorkflow } from "../utils/init";

export async function Chat(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const sessionManager = new SessionManager(
        new ContainerClient(
            process.env.BLOB_CONTAINER_URL!,
            new StorageSharedKeyCredential(
                process.env.STORAGE_ACCOUNT_NAME!,
                process.env.STORAGE_ACCOUNT_KEY!
            )
        )
    )
    const chatWorkflow = initWorkflow(
        {
            endpoint: process.env.OPENAI_API_ENDPOINT!, 
            key: process.env.OPENAI_API_KEY!
        },
        {
            embedding: process.env.OPENAI_EMBEDDING_DEPLOYMENT!, 
            completions: process.env.OPENAI_COMPLETIONS_DEPLOYMENT!
        },
        {
            key: process.env.CONTRACTS_HUB_API_KEY!, 
            contentEndpoint: process.env.CONTRACTS_HUB_CONTENT_ENDPOINT!, 
            summaryEndpoint: process.env.CONTRACTS_HUB_SUMMARY_ENDPOINT!,
            searchEndpoint: process.env.CONTRACTS_HUB_SEARCH_ENDPOINT!
        }
    )

    const chatSesh = ChatSessionSchema.parse(await request.json())
    let sessionId = chatSesh.sessionId
    if(sessionId){
        context.log({sessionId: sessionId, status: 'usingExistingSession'})
    }else{
        sessionId = uuidv4()
        context.log({sessionId: sessionId, status: 'createNewSession'})
    }
    const session = await sessionManager.loadSession(sessionId)
    let callData: CallData = {
        session: session, 
        query: chatSesh.query, 
        state: 'MODIFY_QUERY_WITH_HISTORY'
    }
    while(callData.state !== "COMPLETE"){
        try{
            callData = await chatWorkflow.run(callData)
            context.log(JSON.stringify(callData))
        }catch(err){
            context.error(callData)
            context.error(err)
            return {
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(callData)
            }
        }
    }
    await sessionManager.saveSession(callData.session)
    return {
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                llmResponse: callData.llmResponse,
                documents: callData.session.documents,
                sessionId: sessionId
            }
        )
    }

};

app.http('Chat', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: Chat
});
