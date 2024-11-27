import { OpenAIClient } from "@azure/openai";
import { SearchResponse } from './../../apis/search';
import {EvaluateSearch} from '../evaluatesearch';
import { SessionManager } from "../session";
import { VerifySearch, VerifySearch_meta, Search_individual } from "../../apis/searchindexes";
import { SearchIndexesCallData, 
        GenericSearchCallDataIndex,
        SearchMetaDataCallData, 
        AnswerFromSearchCallDataIndex, 
        NeedsMoreContextCallData,
        SearchIndividualCallDataIndex,
        SearchCallDataIndex} from "./states";

import {HistoricalQuieries} from "../session"
// type TypeSearchOptions = "json-index" | "contracts-index" | "summary-index" | "table-index";
type DataItem = {
    captions: any;
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

function generateDictionary(resultDictionary: Dictionary[], fileNameKey: keyof Dictionary, initialResult: any = {}): { resultDictionary: { [key: string]: string }, document_list: string[] } {
    let result: { [key: string]: string } = { ...initialResult };
    const document_list: string[] = [];
    if (initialResult.length === 0){
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
        const sanitizedResultKeys = Object.values(result).map(k => k.replace(/\s/g, ''))
    
        resultDictionary.forEach(dict => {
            let dict1: { [key: string]: string } = {};
            const parts = dict[fileNameKey].split('/');
            const modded_key_split = parts[parts.length - 1];
            const key = modded_key_split + '.pdf';
            const modded_key_unplsit = (modded_key_split + '.pdf').replace(/\s/g, '')
            
            const { [fileNameKey]: _, ...rest } = dict;
            const restAsString = JSON.stringify(rest);
            
            if (sanitizedResultKeys.includes(modded_key_unplsit)) {
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
    
    const uniqueSet = new Set(document_list);
    const uniqueList = Array.from(uniqueSet);
    
    return { resultDictionary: result, document_list: uniqueList };
}

export class SearchMetadata {
    static async run(callData: SearchMetaDataCallData, 
                     openaiClient: OpenAIClient, 
                     deployment: string): Promise<AnswerFromSearchCallDataIndex | SearchCallDataIndex | NeedsMoreContextCallData> {
        let evaluation = false;
        let highestOutgoingChatOrderMessage;
        // let temp_query = '';
        let resultDictionary:any = {};
        let document_list: any = [];
        if (callData.session.grounding_data.length === 0 && callData.session.contractType === 'pharmacy'){
            const data_response: Data = await VerifySearch_meta(callData.query, callData.session.contractType);
            const normalizedDictionaries = normalizeScores(data_response, 'score');
            const sortedItems = normalizedDictionaries.sort((a: { score: number; }, b: { score: number; }) => b.score - a.score);
            const top10_selected_val = sortedItems;//.slice(0, 10);
            // const filteredData = filterByKey(normalizedDictionaries, 0.3, 'score');
            const modifiedData = top10_selected_val.map(({ score, rerankerScore, captions, ...rest }) => rest);
            const { resultDictionary: tempResultDictionary, document_list: tempDocumentList } = generateDictionary(modifiedData, 'ContractFileName', []);
            resultDictionary = tempResultDictionary;
            document_list = tempDocumentList;         
            evaluation = await EvaluateSearch.run(JSON.stringify(resultDictionary), callData.query, openaiClient, deployment);
        }else{
            if (callData.session.contractType === 'pharmacy'){
                resultDictionary = callData.session.grounding_data.filter(dict => dict.key === 'metadata').map(dict => dict.content)[0];
                document_list = callData.session.grounding_data.filter(dict => dict.key === 'document_list').map(dict => dict.content)[0];
            }else{
                resultDictionary = undefined;
            }
            
            
        }
        if (resultDictionary === undefined){
            resultDictionary = {}
            document_list = []
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
  
  export class GetIndexInfo{
    static async execute(callData: SearchIndexesCallData | GenericSearchCallDataIndex, openaiClient: OpenAIClient, deployment: string){
        let typeSearchOptions: string[];
        if (callData.state == 'GENERIC_RESPONSE'){
            typeSearchOptions= [`${callData.session.contractType}_summary-index`];
        }else{
            typeSearchOptions= [`${callData.session.contractType}_table-index`, 
                            `${callData.session.contractType}_chunk-index`,
                            `${callData.session.contractType}_json-index`, 
                            `${callData.session.contractType}_summary-index`];
        }
        let evaluation = false;
        let data_response: Data | null = null;
        let type: string | null = null;
        const dataResponsesArray: any[] = [];
        let tempDocList = []
        tempDocList = callData.session.grounding_data.filter(dict => dict.key === 'document_list').map(dict => dict.content)[0]
        if(tempDocList == undefined){
            tempDocList =  callData.documents;
        }
        
        for (const typeSearchOption of typeSearchOptions) {
            data_response = await VerifySearch(callData.query, tempDocList, typeSearchOption, callData.session.contractType);
            
            if (typeSearchOption.indexOf('chunk-index') !== -1 || typeSearchOption.indexOf('json-index') !== -1 || typeSearchOption.indexOf('summary-index') !== -1 ){
                //evaluation = await EvaluateSearch.run(JSON.stringify(data_response), callData.query, openaiClient, deployment);
                console.log(typeSearchOption)
                console.log(evaluation)
            }
            if (data_response != null) {
                const normalizedDictionaries = normalizeScores(data_response, 'score');
                const sortedItems = normalizedDictionaries.sort((a: { score: number; }, b: { score: number; }) => b.score - a.score);
                const top10_selected_val = sortedItems.slice(0, 10);
                const modifiedData = top10_selected_val.map(({ score, rerankerScore, captions, ...rest }) => rest);
                dataResponsesArray.push(...modifiedData);
            }
            if (evaluation && data_response != null){
                type = typeSearchOption;
                break;
            }
            else { 
                type = typeSearchOption;
            }
        }
        return dataResponsesArray
    }

    

  }



export class SearchIndexes {
    static async run(callData: SearchIndexesCallData, openaiClient: OpenAIClient, deployment: string): Promise<AnswerFromSearchCallDataIndex | NeedsMoreContextCallData> {
        const data_response = await GetIndexInfo.execute(callData, openaiClient, deployment)
        if (data_response === null || data_response.length === 0) {
            return  {
                state: 'NEEDS_MORE_CONTEXT',
                session: callData.session,
                query: callData.query
            }
        } else {
            const normalizedDictionaries = normalizeScores(data_response, 'score');
            let tempDocList = []
            tempDocList = callData.session.grounding_data.filter(dict => dict.key === 'document_list').map(dict => dict.content)[0]
            if(tempDocList == undefined){
                tempDocList =  callData.documents;
            }
            const { resultDictionary: resultDictionary, document_list: document_list } = generateDictionary(normalizedDictionaries, 'fileName', tempDocList);
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
        
        const typeSearchOptions= [`${callData.session.contractType}_json-index`, 
                                    `${callData.session.contractType}_summary-index`, 
                                    `${callData.session.contractType}_table-index`, 
                                    `${callData.session.contractType}_chunk-index`];
        let evaluation = false;
        let data_response: Data | null = null;
        let type: string | null = null;
        const dataResponsesArray: any[] = [];

        for (const typeSearchOption of typeSearchOptions) {
            data_response = await Search_individual(callData.query, callData.documents, typeSearchOption, callData.session.contractType);
            evaluation = await EvaluateSearch.run(JSON.stringify(data_response), callData.query, openaiClient, deployment);      
            console.log(evaluation)      
            type = typeSearchOption;
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
            const outputArray: { [key: string]: string }[] = [];
            let prefix: string;
            normalizedDictionaries.forEach((item) => {
                const holder: string = type ===`${prefix}contracts-index` ? item.chunk: item.content
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
