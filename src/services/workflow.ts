import { OpenAIClient } from "@azure/openai";
import { ModifyQueryWithHistory } from "./states/modifyQueryWithHistory";
import { CallData } from "./states/states";
import { Finalize } from "./states/finalize";
import { ApiCredentials, Deployments } from "../utils/types";
import { ParseSearchQuery } from "./states/parseQuery";
import { Search } from "./states/search";
import { AnswerQueryFromSearch } from "./states/answerFromSearch";
import { GetDocuments } from "./states/getDocuments";
import { NeedsMoreContext } from "./states/needsMoreContext";
import { SessionManager } from "../services/session";

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

    async run(callData: CallData, sessionManager: SessionManager | null= null): Promise<CallData>{
        if(callData.state === "MODIFY_QUERY_WITH_HISTORY"){
            return await ModifyQueryWithHistory.run(callData, this.openaiClient, this.openaiDeployments.completions)
        }
        else if(callData.state === "PARSE_SEARCH_QUERY"){
            return await ParseSearchQuery.run(callData, this.openaiClient, this.openaiDeployments.completions)
        }
        else if(callData.state === "NEEDS_MORE_CONTEXT"){
            return await NeedsMoreContext.run(callData, this.openaiClient, this.openaiDeployments.completions)
        }
        else if(callData.state === "GET_DOCUMENTS"){
            return await GetDocuments.run(callData, {
                key: this.contractsHubCredentials.key, 
                endpoint: this.contractsHubCredentials.searchEndpoint
            })
        }
        else if(callData.state === "SEARCH"){
            return await Search.run(callData, {
                key: this.contractsHubCredentials.key, 
                searchEndpoint: this.contractsHubCredentials.searchEndpoint, 
                contentEndpoint: this.contractsHubCredentials.contentEndpoint
            })
        }
        else if(callData.state === "ANSWER_FROM_SEARCH"){
            return await AnswerQueryFromSearch.run(callData, this.openaiClient, this.openaiDeployments.completions)
        }
        else if(callData.state === "FINALIZE") {
            return Finalize.run(callData)
        }
        else{
            throw new WorkflowError(`Unknown State: ${callData.state}`)
        }
    }
}


