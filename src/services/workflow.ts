import { OpenAIClient } from "@azure/openai";
import { ModifyQueryWithHistory } from "./states/modifyQueryWithHistory";
import { CallData } from "./states/states";
import { GetDocumentFromSummary } from "./states/getDocumentBySummary";
import { GetDocumentContent } from "./states/getContentByDocument";
import { RunLLMWithContent } from "./states/runLLM";
import { Finalize } from "./states/finalize";
import { ApiCredentials, Deployments } from "../utils/types";
import { LLMRouter } from "./states/router";
import { ParseSearchQuery } from "./states/parseQuery";
import { Search } from "./states/search";

export class WorkflowError extends Error {}

export class ChatWorkflow {
    openaiClient: OpenAIClient
    openaiDeployments:  Deployments
    contractsHubCredentials: ApiCredentials

    constructor(openaiClient: OpenAIClient, openaiDeployments: Deployments, contractsHubCredentials: ApiCredentials){
        this.openaiClient = openaiClient
        this.openaiDeployments = openaiDeployments
        this.contractsHubCredentials = contractsHubCredentials
    }

    async run(callData: CallData): Promise<CallData>{
        if (callData.state === "LLM_ROUTER"){
            return await LLMRouter.run(callData, this.openaiClient, this.openaiDeployments.completions)
        }
        else if(callData.state === "PARSE_SEARCH_QUERY"){
            return await ParseSearchQuery.run(callData, this.openaiClient, this.openaiDeployments.completions)
        }
        else if(callData.state === "SEARCH"){
            return await Search.run(callData, {key: this.contractsHubCredentials.key, endpoint: this.contractsHubCredentials.searchEndpoint})
        }
        else if(callData.state === "MODIFY_QUERY_WITH_HISTORY"){
            return await ModifyQueryWithHistory.run(callData, this.openaiClient, this.openaiDeployments.completions)
        }
        else if(callData.state === "GET_DOCUMENT_FROM_SUMMARY"){
            return await GetDocumentFromSummary.run(callData, {key: this.contractsHubCredentials.key, endpoint: this.contractsHubCredentials.summaryEndpoint})
        }
        else if(callData.state === "GET_DOCUMENT_CONTENT") {
            return await GetDocumentContent.run(callData,  {key: this.contractsHubCredentials.key, endpoint: this.contractsHubCredentials.contentEndpoint})
        }
        else if(callData.state === "RUN_LLM_WITH_CONTENT"){
            return await RunLLMWithContent.run(callData, this.openaiClient, this.openaiDeployments.completions)
        }
        else if(callData.state === "FINALIZE") {
            return Finalize.run(callData)
        }
        else{
            throw new WorkflowError(`Unknown State: ${callData.state}`)
        }
    }
}


