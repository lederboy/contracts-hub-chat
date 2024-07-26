import { GetContentResponse } from "../../apis/content"
import { SearchResponse } from "../../apis/search"
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
    parsedQuery:{
        searchParams: Record<string,any>[],
        selectParams: Record<string, any>[]
    } //TODO add definition
}
export interface SearchCallData extends BaseCallData {
    state: "SEARCH",
    query: string,
    documents: string[]
}

export interface AnswerFromSearchCallData extends BaseCallData {
    state: "ANSWER_FROM_SEARCH"
    query: string
    documents: string[]
    searchResponse: Record<string, string>
}
export interface ModifyQueryCallData extends BaseCallData {
    state: 'MODIFY_QUERY_WITH_HISTORY'
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
                       GetDocumentsCallData           |
                       AnswerFromSearchCallData       |
                       ModifyQueryCallData            |
                       FinalizeCallData               |
                       CompleteCallData
