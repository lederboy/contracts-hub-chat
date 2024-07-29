import { AzureKeyCredential, OpenAIClient } from "@azure/openai";
import { ChatWorkflow } from "../services/workflow";
import { ChatWorkflowSearch } from "../services/workflowIndividualContracts";
import { ApiCredentials, Deployments } from "./types";


export const initWorkflow = (openaiCreds: {key: string, endpoint: string}, deployments: Deployments, contractsHubCredentials: ApiCredentials): ChatWorkflow =>  {
    const openAiClient = new OpenAIClient(openaiCreds.endpoint,new AzureKeyCredential(openaiCreds.key))
    const chatWorkflow = new ChatWorkflow(openAiClient, deployments, contractsHubCredentials)
    return chatWorkflow
}


export const initWorkflowSearch = (openaiCreds: {key: string, endpoint: string}, deployments: Deployments, contractsHubCredentials: ApiCredentials): ChatWorkflow =>  {
    const openAiClient = new OpenAIClient(openaiCreds.endpoint,new AzureKeyCredential(openaiCreds.key))
    const chatWorkflow = new ChatWorkflowSearch(openAiClient, deployments, contractsHubCredentials)
    return chatWorkflow
}