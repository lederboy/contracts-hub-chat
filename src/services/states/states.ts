import { GetContentResponse } from "../../apis/content"
import { SearchRequest, SearchResponse } from "../../apis/search"
import { ChatSession, ChatHistory_AI } from "../session"

export interface BaseCallData {
    session: ChatHistory_AI
}

export interface LLMRouterCallData extends BaseCallData {
    state: "LLM_ROUTER",
    query: string
}

export interface ParseQueryCallData extends BaseCallData {
    state: "PARSE_SEARCH_QUERY"
    query: string
}

export interface GetDocumentsCallData extends BaseCallData {
    state: "GET_DOCUMENTS",
    query: string
    parsedQuery: SearchRequest
}
export interface SearchCallData extends BaseCallData {
    state: "SEARCH",
    query: string,
    documents: string[]
}

export interface AnswerFromSearchIndexCallData extends BaseCallData {
    state: "ANSWER_FROM_SEARCH"
    query: string
    searchResponse: Record<string, string>
}

export interface AnswerFromSearchCallData extends BaseCallData {
    state: "ANSWER_FROM_SEARCH"
    query: string
    documents: string[]
    searchResponse: Record<string, string>
}

export interface SearchCallDataIndex extends BaseCallData {
    state: "SEARCH_WITH_INDEXES"
    query: string
    documents: string[]
    searchResponse: Record<string, string>,
    override: boolean
}


export interface AnswerFromSearchCallDataIndex extends BaseCallData {
    state: "ANSWER_FROM_SEARCH"
    query: string
    documents: string[]
    searchResponse: any,
    override: boolean
}





export interface ModifyQueryCallData extends BaseCallData {
    state: 'MODIFY_QUERY_WITH_HISTORY'
    query: string
}

export interface DefineQueryTitleCallData extends BaseCallData {
    state: 'DEFINE_QUERY_TITLE'
    query: string
}

export interface DefineResponseCallData extends BaseCallData {
    state: 'DEFINE_RESPONSE_TYPE'
    query: string
}

export interface SearchIndividualCallDataIndex extends BaseCallData {
    state: "SEARCH_IND_INDEXES"
    query: string
    documents: string
    type_search: string
}

export interface SearchIndexesCallData extends BaseCallData {
    state: 'SEARCH_WITH_INDEXES'
    query: string,
    searchResponse: {[key: string]: string;}
}


export interface SearchMetaDataCallData extends BaseCallData {
    state: 'SEARCH_WITH_METADATA'
    query: string
}

export interface  NeedsMoreContextCallData extends BaseCallData {
    state: 'NEEDS_MORE_CONTEXT',
    query: string
}
export interface FinalizeCallData extends BaseCallData {
    state: 'FINALIZE',
    query: string
    documents: string[]
    llmResponse: string,
    score: string | undefined,
    explanation: string | undefined
}
export interface EvaluateCallData extends BaseCallData {
    state: "EVALUATE",
    query: string
    documents: string[]
    llmResponse: string
}


export interface CompleteCallData extends BaseCallData {
    state: 'COMPLETE'
    llmResponse: string,
    score: string | undefined,
    explanation: string | undefined
}
export type CallData =
                       DefineQueryTitleCallData       |
                       DefineResponseCallData         |
                       ParseQueryCallData             |
                       SearchCallData                 |
                       SearchIndexesCallData          |
                       SearchMetaDataCallData         |
                       GetDocumentsCallData           |
                       AnswerFromSearchCallData       |
                       SearchIndividualCallDataIndex  |
                       EvaluateCallData               |
                       AnswerFromSearchCallDataIndex  |
                       SearchCallDataIndex            |
                       ModifyQueryCallData            |
                       FinalizeCallData               |
                       NeedsMoreContextCallData       |
                       CompleteCallData
