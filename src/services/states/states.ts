import { GetContentResponse } from "../../apis/content"
import { SearchRequest, SearchResponse } from "../../apis/search"
import { ChatSession } from "../session"

export interface BaseCallData {
    session: ChatSession
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
    searchResponse: Record<string, string>,
    override: boolean
}


export interface ModifyQueryCallData extends BaseCallData {
    state: 'MODIFY_QUERY_WITH_HISTORY'
    query: string
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
    llmResponse: string
}


export interface CompleteCallData extends BaseCallData {
    state: 'COMPLETE'
    llmResponse: string
}
export type CallData =
                       ParseQueryCallData             |
                       SearchCallData                 |
                       SearchIndexesCallData          |
                       SearchMetaDataCallData         |
                       GetDocumentsCallData           |
                       AnswerFromSearchCallData       |
                       AnswerFromSearchCallDataIndex  |
                       SearchCallDataIndex            |
                       ModifyQueryCallData            |
                       FinalizeCallData               |
                       NeedsMoreContextCallData       |
                       CompleteCallData
