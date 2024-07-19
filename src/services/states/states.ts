import { GetContentResponse } from "../../apis/content"
import { ChatSession } from "../session"

export interface BaseCallData {
    session: ChatSession
}
export interface ModifyQueryCallData extends BaseCallData {
    state: 'MODIFY_QUERY_WITH_HISTORY'
    query: string
}
export interface GetDocumentFromSummaryCallData extends BaseCallData {
    state: 'GET_DOCUMENT_FROM_SUMMARY'
    modifiedQuery: string
}
export interface GetDocumentContentCallData extends BaseCallData {
    state: 'GET_DOCUMENT_CONTENT',
    query: string
    document: string
}
export interface RunLLMWithContentCallData extends BaseCallData {
    state: 'RUN_LLM_WITH_CONTENT',
    query: string,
    document: string
    content: GetContentResponse
}
export interface FinalizeCallData extends BaseCallData {
    state: 'FINALIZE',
    query: string
    document: string
    llmResponse: string
}

export interface CompleteCallData extends BaseCallData {
    state: 'COMPLETE'
    llmResponse: string
}
export type CallData = ModifyQueryCallData            |
                       GetDocumentFromSummaryCallData |
                       GetDocumentContentCallData     |
                       RunLLMWithContentCallData      |
                       FinalizeCallData               |
                       CompleteCallData
