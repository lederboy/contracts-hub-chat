import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AzureKeyCredential, OpenAIClient } from "@azure/openai";
import { SectionCompareSchema } from "../definitions/exchange";
import {LLMSectionCompare} from '../services/comparesection';
import { SessionManager } from "../services/session";
import { ContainerClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { CallData } from "../services/states/states";
import { initWorkflowAIS } from "../utils/init";


export async function SectionCompare(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const sectionSesh = SectionCompareSchema.parse(await request.json());
    
    const openAiClient = new OpenAIClient(process.env.OPENAI_API_ENDPOINT!,new AzureKeyCredential(process.env.OPENAI_API_KEY!))
    let sectionText = sectionSesh.text;   
    let section = sectionSesh.sectionText;
    let documentName = sectionSesh.documentName;
    let user = sectionSesh.user;
    let contractType = sectionSesh.contractType==undefined? 'pharmacy': sectionSesh.contractType;
    
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


    const dataDefinitions = await sessionManager.loadDataDictionary(user, contractType)
    let sectionName = await LLMSectionCompare.run(section,  Object.keys(dataDefinitions).join(', '), openAiClient, true);

    // let evaluation = await LLMSectionCompare.run(JSON.stringify(resultDictionary), callData.query, openAiClient, 'analysis');
    
    try {
        return {
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    title: 'a'
                }
            )
        }
      } catch (error) {
        return {
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    title: 'a'
                }
            )
        }
    }
    

};

app.http('SectionCompare', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: SectionCompare
});
