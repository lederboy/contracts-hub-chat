import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ChatSessionSchemaAIS } from "../definitions/exchange";
import {v4 as uuidv4} from 'uuid';
import { SessionManager } from "../services/session";
import { ContainerClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { CallData } from "../services/states/states";
import { initWorkflowAIS } from "../utils/init";


const substrings = [
    "Contract File Name",
    "Line of Business",
    "Agreement Effective Date",
    "Agreement End Date",
    "Vaccine List Available",
    "Chain Code",
    "Active Status",
    "Active",
    "Company"
];

const normalize = (input: string): string => {
    return input.toLowerCase().replace(/[-\s]+/g, "");
};

export async function ChatAIS(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const sessionManager = new SessionManager(
        new ContainerClient(
            process.env.BLOB_CONTAINER_URL!,
            new StorageSharedKeyCredential(
                process.env.STORAGE_ACCOUNT_NAME!,
                process.env.STORAGE_ACCOUNT_KEY!
            )
        )
    )
    const chatWorkflow = initWorkflowAIS(
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

    const chatSesh = ChatSessionSchemaAIS.parse(await request.json());
    let sessionId = chatSesh.sessionId;
    let user = chatSesh.user;
    // let sessionId = ''
    let title_def = false;
    if(sessionId){
        context.log({sessionId: sessionId, status: 'usingExistingSession'})
    }else{
        title_def = true
        sessionId = uuidv4()
        context.log({sessionId: sessionId, status: 'createNewSession'})
    }
    const session = await sessionManager.loadSession(user, sessionId)
    // const normalizedStr = normalize(chatSesh.query);
    // const containsAnySubstring = substrings.some(substring => normalizedStr.includes(normalize(substring)));
    // const containsAnySubstring = history_check? 'MODIFY_QUERY_WITH_HISTORY' : 'SEARCH_WITH_METADATA'


    let callData: CallData = {
        session: session, 
        query: chatSesh.query, 
        state: title_def? 'DEFINE_QUERY_TITLE' : 'SEARCH_WITH_METADATA'
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
    await sessionManager.saveSession(user, callData.session)
    return {
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                title: callData.session.title,
                llmResponse: callData.llmResponse,
                documents: callData.session.chatHistory[callData.session.chatHistory.length - 1].documents,
                sessionId: sessionId
            }
        )
    }

};

app.http('ChatAIS', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: ChatAIS
});
