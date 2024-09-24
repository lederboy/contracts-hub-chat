import { OpenAIClient } from "@azure/openai";
import { SearchResponse } from './../../apis/search';
import {EvaluateSearch} from '../evaluatesearch';
import { SessionManager } from "../session";
import { VerifySearch, VerifySearch_2, Search_individual } from "../../apis/searchindexes";
import { SearchIndexesCallData, 
        SearchMetaDataCallData, 
        AnswerFromSearchCallDataIndex, 
        NeedsMoreContextCallData,
        SearchIndividualCallDataIndex,
        SearchCallDataIndex} from "./states";

import {HistoricalQuieries} from "../session"
type TypeSearchOptions = "json-index" | "contracts-index" | "summary-index" | "table-index";
type DataItem = {
    score: number;
    chunk: string;
    content: string;
    fileName: string;
    rerankerScore: number;
    content_chunks: string;
    fileName_chunks: string;
    score_summary: number;
    rerankerScore_summary: number;
    text_summary: string;
    highlights_summary: string;
    content_summary: string;
};

type Data = DataItem[];

function filterByScoreChunks(data: Data, threshold: number): DataItem[] {
    return data.filter(item => item.score >= threshold);
}

function filterByKey(data: Data, threshold: number, key: keyof DataItem): DataItem[] {
    return data.filter(item => (item[key] as number) >= threshold);
}

function normalizeScores(dictionaries: Data, key: keyof DataItem): Data {
    if (dictionaries.length === 0) return dictionaries;
    const scores = dictionaries.map(dict => dict[key]).filter(value => typeof value === 'number') as number[];
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    return dictionaries.map(dict => ({
        ...dict,
        [key]: ((dict[key] as number) - minScore) / (maxScore - minScore)
    }));
}


type Dictionary = {
    fileName_chunks: string;
    fileName_summary?: string;
    [key: string]: any;
};


type OutputData = {
    score_summary: number | null;
    rerankerScore_summary: number;
    content_summary: string;
  };

function generateDictionary(
        resultDictionary: Dictionary[], 
        fileNameKey: keyof Dictionary,
        initialResult: { [key: string]: string } = {}): { resultDictionary: { [key: string]: string }, document_list: string[] } {
    let result: { [key: string]: string } = { ...initialResult };
    const document_list: string[] = [];
    if (Object.keys(initialResult).length === 0){
        resultDictionary.forEach(dict => {
            let dict1: { [key: string]: string } = {};
            const key = dict[fileNameKey] + '.pdf';
            const { [fileNameKey]: _, ...rest } = dict;
            const restAsString = JSON.stringify(rest);
            if (key in result) {
                result[key] += '; ' + restAsString;
            } else {
                dict1[key] = restAsString;
                result = { ...result, ...dict1 };
            }
            document_list.push(key);
        });
    } else{
        const sanitizedResultKeys = Object.keys(result).map(k => k.replace(/\s/g, ''))
    
        resultDictionary.forEach(dict => {
            let dict1: { [key: string]: string } = {};
            const key = dict[fileNameKey] + '.pdf';
            const modded_key = (dict[fileNameKey] + '.pdf').replace(/\s/g, '')
            const { [fileNameKey]: _, ...rest } = dict;
            const restAsString = JSON.stringify(rest);
            
            if (sanitizedResultKeys.includes(modded_key)) {
                if (key in result) {
                    result[key] += '; ' + restAsString;
                } else {
                    dict1[key] = restAsString;
                    result = { ...result, ...dict1 };
                }
                document_list.push(key);
            }
        });
    
    }

    
    return { resultDictionary: result, document_list };
}

export class SearchMetadata {
    static async run(callData: SearchMetaDataCallData, 
                     openaiClient: OpenAIClient, 
                     deployment: string,
                     sessionManager: SessionManager | null = null): Promise<AnswerFromSearchCallDataIndex | SearchCallDataIndex | NeedsMoreContextCallData> {
        let evaluation = false;
        let highestOutgoingChatOrderMessage;
        let temp_query = '';
        let resultDictionary:any;
        let document_list: any;
        if (callData.session.grounding_data.length === 0){
            if (callData.session.chatHistory.length > 0){
                const outgoingMessages = callData.session.chatHistory.filter(message => message.direction === 'outgoing');
                highestOutgoingChatOrderMessage = outgoingMessages.reduce((prev, current) => (prev.chatOrder > current.chatOrder) ? prev : current);
                temp_query += highestOutgoingChatOrderMessage.content

            }
            temp_query += '; '+ callData.query;
            // callData.query = temp_query;
            const data_response: Data = await VerifySearch_2(temp_query);
            const normalizedDictionaries = normalizeScores(data_response, 'score');
            // const filteredData = filterByKey(normalizedDictionaries, 0.3, 'score');
            const { resultDictionary: tempResultDictionary, document_list: tempDocumentList } = generateDictionary(normalizedDictionaries, 'ContractFileName', {});
            
            resultDictionary = tempResultDictionary;
            document_list = tempDocumentList;
            // let highestChatOrderMessage: HistoricalQuieries;
            // if (callData.session.chatHistory.length > 0){
            //     const incomingMessages = callData.session.chatHistory.filter(message => message.direction === 'incoming');
            //     highestChatOrderMessage = incomingMessages.reduce((prev, current) => (prev.chatOrder > current.chatOrder) ? prev : current); 
            //     if (highestChatOrderMessage.documents!= null && highestChatOrderMessage.documents.length > 0){
            //         document_holder.push(...highestChatOrderMessage.documents)
            //     }
            // }
            // document_holder.push(...document_list)
            
            
            
            evaluation = await EvaluateSearch.run(JSON.stringify(resultDictionary), callData.query, openaiClient, deployment);  
            if (evaluation && sessionManager !== null){
                callData.session.grounding_data.push({key: "metadata", content: resultDictionary})
                callData.session.grounding_data.push({key: "document_list", content: document_list})
            }
        }else{
            resultDictionary = callData.session.grounding_data.filter(dict => dict.key === 'metadata').map(dict => dict.content)[0];
            document_list = callData.session.grounding_data.filter(dict => dict.key === 'document_lista').map(dict => dict.content)[0];
        }
        
        if (Object.keys(resultDictionary).length <= 2 || !evaluation){
            return {
                state: "SEARCH_WITH_INDEXES",
                searchResponse: resultDictionary,
                session: callData.session,
                documents: document_list,
                query: callData.query,
                override: true
            }

        }else{
            return {
                state: "ANSWER_FROM_SEARCH",
                searchResponse: resultDictionary,
                session: callData.session,
                documents: document_list,
                query: callData.query,
                override: true
            }
        }
        
    }
}

function removeBreakLines(str: string): string {
    return str.replace(/\s+/g, '');
  }

function normalizeContent(content: string): string {
    // List of common words to exclude
    const commonWords = ["of", "the", "at", "and", "a", "an", "in", "on", "to"];
    
    // Remove line breaks and convert to lowercase
    let normalized = content.replace(/\s+/g, ' ').toLowerCase();
    
    // Split the content into words, filter out common words, and join back into a string
    normalized = normalized.split(' ').filter(word => !commonWords.includes(word)).join(' ');

    return normalized;
}

function getUniqueDictionaries(dictionaries: Dictionary[]): Dictionary[] {
    const uniqueSet = new Set<string>();
    const uniqueDictionaries: Dictionary[] = [];
    for (const dict of dictionaries) {
        const normalizedContent = normalizeContent(dict.content_table);
        const normalizedContentChunks = removeBreakLines(normalizedContent);
        const uniqueKey = `${normalizedContentChunks}|${dict.fileName_table}`;
        if (!uniqueSet.has(uniqueKey)) {
            uniqueSet.add(uniqueKey);
            uniqueDictionaries.push(dict);
        }
    }
  
    return uniqueDictionaries;
  }
  

export class SearchIndexes {
    static async run(callData: SearchIndexesCallData, openaiClient: OpenAIClient, deployment: string): Promise<AnswerFromSearchCallDataIndex | NeedsMoreContextCallData> {
        
        const typeSearchOptions: TypeSearchOptions[] = ["json-index", "summary-index", "table-index", "contracts-index"];
        let evaluation = false;
        let data_response: Data | null = null;
        let type: string | null = null;
        const dataResponsesArray: any[] = [];
        
        let highestOutgoingChatOrderMessage;
        let temp_query = '';
        if (callData.session.chatHistory.length > 0){
            const outgoingMessages = callData.session.chatHistory.filter(message => message.direction === 'outgoing');
            highestOutgoingChatOrderMessage = outgoingMessages.reduce((prev, current) => (prev.chatOrder > current.chatOrder) ? prev : current);
            temp_query += highestOutgoingChatOrderMessage.content

        }
        temp_query += '; '+ callData.query;


        for (const typeSearchOption of typeSearchOptions) {
            console.log(typeSearchOption)
            data_response = await VerifySearch(callData.query, Object.keys(callData.searchResponse), typeSearchOption);
            evaluation = await EvaluateSearch.run(JSON.stringify(data_response), callData.query, openaiClient, deployment);      
            console.log(evaluation)
            if (data_response != null) {
                dataResponsesArray.push(...data_response);
            }
            
            if (evaluation){type = typeSearchOption;break;}
            else { type = typeSearchOption;}
        }

        if (data_response === null || data_response.length === 0 || !evaluation) {
            data_response = dataResponsesArray
        }
        
        
        
        if (data_response === null || data_response.length === 0) {
            return  {
                state: 'NEEDS_MORE_CONTEXT',
                session: callData.session,
                query: callData.query
            }
        } else {
            const normalizedDictionaries = normalizeScores(data_response, 'score');
            // const uniqueDictionaries = getUniqueDictionaries(normalizedDictionaries);
            // const filteredData = filterByKey(normalizedDictionaries, 0.5, 'score');
            const { resultDictionary: resultDictionary, document_list: document_list } = generateDictionary(normalizedDictionaries, 'fileName_summary', callData.searchResponse);
            return {
                state: "ANSWER_FROM_SEARCH",
                searchResponse: resultDictionary,
                session: callData.session,
                documents: document_list,
                query: callData.query,
                override: true
            }
        }     

        
    }

    static async run_individual(callData: SearchIndividualCallDataIndex, openaiClient: OpenAIClient, deployment: string): Promise<AnswerFromSearchCallDataIndex | NeedsMoreContextCallData> {
        
        const typeSearchOptions: TypeSearchOptions[] = ["json-index", "summary-index", "table-index", "contracts-index"];
        let evaluation = false;
        let data_response: Data | null = null;
        let type: string | null = null;

        for (const typeSearchOption of typeSearchOptions) {
            data_response = await Search_individual(callData.query, callData.documents, typeSearchOption);
            evaluation = await EvaluateSearch.run(JSON.stringify(data_response), callData.query, openaiClient, deployment);      
            console.log(evaluation)      
            type = typeSearchOption;
            if (evaluation){type = typeSearchOption;break;};
        }


        
        if (data_response === null || data_response.length === 0) {
            return  {
                state: 'NEEDS_MORE_CONTEXT',
                session: callData.session,
                query: callData.query
            }
        } else {
            const normalizedDictionaries = normalizeScores(data_response, 'score');
            const outputArray: { [key: string]: string }[] = [];
            normalizedDictionaries.forEach((item) => {
                const holder: string = type ==='contracts-index' ? item.chunk: item.content
                const parsedContent = holder.replace("{","").replace("}","")
                const outputData = {
                    score: item.score,
                    rerankerScore: item.rerankerScore,
                    content: parsedContent
                };

                const formattedString = JSON.stringify(outputData);            
                const entry = { [item.fileName]: formattedString };
                outputArray.push(entry);
            });
            
            return {
                state: "ANSWER_FROM_SEARCH",
                searchResponse: outputArray,
                session: callData.session,
                documents: [callData.documents],
                query: callData.query,
                override: true
            }
        }     

        
    }
}
