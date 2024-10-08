import { AzureKeyCredential, OpenAIClient } from "@azure/openai";
import { ChatWorkflow } from "../services/workflow";
import { ChatWorkflowAIS } from "../services/workflowAIS";
import { ApiCredentials, Deployments } from "./types";


export const initWorkflow = (openaiCreds: {key: string, endpoint: string}, deployments: Deployments, contractsHubCredentials: ApiCredentials): ChatWorkflow =>  {
    const openAiClient = new OpenAIClient(openaiCreds.endpoint,new AzureKeyCredential(openaiCreds.key))
    const chatWorkflow = new ChatWorkflow(openAiClient, deployments, contractsHubCredentials)
    return chatWorkflow
}

export const initWorkflowAIS = (openaiCreds: {key: string, endpoint: string}, deployments: Deployments, contractsHubCredentials: ApiCredentials): ChatWorkflow =>  {
    const openAiClient = new OpenAIClient(openaiCreds.endpoint,new AzureKeyCredential(openaiCreds.key))
    const chatWorkflow = new ChatWorkflowAIS(openAiClient, deployments, contractsHubCredentials)
    return chatWorkflow
}