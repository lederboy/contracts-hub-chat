import { VerifySearch, VerifySearch_2 } from "../../apis/searchindexes";
import { SearchIndexesCallData, SearchMetaDataCallData, AnswerFromSearchCallDataIndex} from "./states";


type DataItem = {
    score: number;
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

    // Extract scores and ensure they are numbers
    const scores = dictionaries.map(dict => dict[key]).filter(value => typeof value === 'number') as number[];
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    // Normalize the scores
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

function generateDictionary(resultDictionary: Dictionary[], fileNameKey: keyof Dictionary): { resultDictionary: { [key: string]: string }, document_list: string[] } {
    const result: { [key: string]: string } = {};
    const document_list: string[] = [];

    resultDictionary.forEach(dict => {
        const key = dict[fileNameKey] + '.pdf';
        const { [fileNameKey]: _, ...rest } = dict;
        const restAsString = JSON.stringify(rest);
        result[key] = restAsString;
        document_list.push(key);
    });

    return { resultDictionary: result, document_list };
}

export class SearchMetadata {
    static async run(callData: SearchMetaDataCallData): Promise<AnswerFromSearchCallDataIndex> {
        const data_response: Data = await VerifySearch_2(callData.query);
        const normalizedDictionaries = normalizeScores(data_response, 'score');
        const filteredData = filterByKey(normalizedDictionaries, 0.5, 'score');
        const { resultDictionary, document_list } = generateDictionary(filteredData, 'ContractFileName');
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

export class SearchIndexes {
    static async run(callData: SearchIndexesCallData): Promise<AnswerFromSearchCallDataIndex> {
        const data_response: Data = await VerifySearch(callData.query);
        

        // Normalize and filter by score
        const normalizedDictionaries = normalizeScores(data_response, 'score');
        const filteredData = filterByKey(normalizedDictionaries, 0.5, 'score');
        // const { resultDictionary: test, document_list: list } = generateDictionary(filteredData, 'fileName_chunks');

        // Normalize and filter by score_summary
        const normalizedDictionaries_sum = normalizeScores(data_response, 'score_summary');
        const filteredData_sum = filterByKey(normalizedDictionaries_sum, 0.83, 'score_summary');
        const { resultDictionary: resultDictionary_sum, document_list: document_list_sum } = generateDictionary(filteredData_sum, 'fileName_summary');


        return {
            state: "ANSWER_FROM_SEARCH",
            searchResponse: resultDictionary_sum,
            session: callData.session,
            documents: document_list_sum,
            query: callData.query,
            override: true
        }
    }
}