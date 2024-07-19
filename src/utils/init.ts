import { AzureKeyCredential, OpenAIClient } from "@azure/openai";
import { ChatWorkflow } from "../services/workflow";
import { ApiCredentials, Deployments } from "./types";


// export const initWorkflow = (openaiCreds: {key: string, endpoint: string}, deployments: Deployments, contractsHubCredentials: ApiCredentials): ChatWorkflow =>  {
//     const openAiClient = new OpenAIClient(openaiCreds.key,new AzureKeyCredential(process.env.OPENAI_API_KEY!))
//     const chatWorkflow = new ChatWorkflow(
//        ,
//         {
//             embedding: process.env.OPENAI_EMBEDDING_DEPLOYMENT!, 
//             completions: process.env.OPENAI_COMPLETIONS_DEPLOYMENT!
//         },
//         {
//             key: process.env.CONTRACTS_HUB_API_KEY!, 
//             contentEndpoint: process.env.CONTRACTS_HUB_CONTENT_ENDPOINT!, 
//             summaryEndpoint: process.env.CONTRACTS_HUB_SUMMARY_ENDPOINT!
//         }
//     )
// }