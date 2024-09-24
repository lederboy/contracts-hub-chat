import { OpenAIClient } from "@azure/openai";
import { DefineQueryTitle } from "./states/defineQueryTitle";
import { DefineResponse } from "./states/defineResponse";
import { ModifyQueryWithHistory } from "./states/modifyQueryWithHistory";
import { SearchIndexes, SearchMetadata } from "./states/searchIndexes";
import { CallData } from "./states/states";
import { Finalize } from "./states/finalize";
import { ApiCredentials, Deployments } from "../utils/types";
import { ParseSearchQuery } from "./states/parseQuery";
import { Search } from "./states/search";
import { AnswerQueryFromSearch } from "./states/answerFromSearch";
import { EvaluateLLMResponse } from "./states/evaluateResponse";
import { GetDocuments } from "./states/getDocuments";
import { NeedsMoreContext } from "./states/needsMoreContext";
import { SessionManager } from "./session";

export class WorkflowError extends Error {}

export class ChatWorkflowAIS {
    openaiClient: OpenAIClient
    openaiDeployments:  Deployments
    contractsHubCredentials: ApiCredentials

    constructor(openaiClient: OpenAIClient, openaiDeployments: Deployments, contractsHubCredentials: ApiCredentials){
        this.openaiClient = openaiClient
        this.openaiDeployments = openaiDeployments
        this.contractsHubCredentials = contractsHubCredentials
    }

    async run(callData: CallData, sessionManager: SessionManager): Promise<CallData>{
        if(callData.state === "DEFINE_QUERY_TITLE"){
            return await DefineQueryTitle.run(callData, this.openaiClient, this.openaiDeployments.completions)
        }
        else if(callData.state === "DEFINE_RESPONSE_TYPE"){
            return await DefineResponse.run(callData, this.openaiClient, this.openaiDeployments.completions)
        }
        else if(callData.state === "MODIFY_QUERY_WITH_HISTORY"){
            return await ModifyQueryWithHistory.run(callData, this.openaiClient, this.openaiDeployments.completions)
        }
        else if(callData.state === "SEARCH_WITH_METADATA"){
            return await SearchMetadata.run(callData, this.openaiClient, this.openaiDeployments.completions, sessionManager)
        }
        else if(callData.state === "SEARCH_IND_INDEXES"){
            return await SearchIndexes.run_individual(callData, this.openaiClient, this.openaiDeployments.completions)
        }
        else if(callData.state === "SEARCH_WITH_INDEXES"){
            return await SearchIndexes.run(callData, this.openaiClient, this.openaiDeployments.completions)
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
            return await AnswerQueryFromSearch.run(callData, this.openaiClient, this.openaiDeployments.completions, true)
        }
        else if(callData.state === "EVALUATE"){
            return await EvaluateLLMResponse.run(callData, this.openaiClient, this.openaiDeployments.completions, true)
        }
        else if(callData.state === "FINALIZE") {
            return Finalize.run(callData)
        }
        else{
            throw new WorkflowError(`Unknown State: ${callData.state}`)
        }
    }
}


