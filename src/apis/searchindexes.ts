import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

function removeSearchStrings(arr:any) {
    return arr.map((dict: { [x: string]: any; hasOwnProperty: (arg0: string) => any; }) => {
        const newDict: any = {};
        for (const key in dict) {
            if (dict.hasOwnProperty(key)) {
                // Remove "@search.captions." and "@search." from the key
                const newKey = key.replace(/^@search\.captions\.|^@search\./, '');
                newDict[newKey] = dict[key];
            }
        }
        return newDict;
    });
  }
  


  function replaceScoreChunksKey(arr: any, suffix: string) {
    return arr.map((dict: { [x: string]: any; hasOwnProperty: (arg0: string) => any; }) => {
        const newDict: any = {};
        for (const key in dict) {
            if (dict.hasOwnProperty(key)) {
                // Check if the key is "score_chunks" and replace it with "score"
                const newKey = key === `score${suffix}` ? "score" : key;
                newDict[newKey] = dict[key];
            }
        }
        return newDict;
    });
}



async function flattenCaptions(dictionary: any, suffix: string) {
    const flattenedDict: any = {};
    for (const [key, value] of Object.entries(dictionary)) {
      if (key === '@search.captions' && Array.isArray(value) && value.length > 0) {
        const captions = value[0];
        for (const [subKey, subValue] of Object.entries(captions)) {
          flattenedDict[`${key}.${subKey}${suffix}`] = subValue;
        }
      } else {
        flattenedDict[`${key}${suffix}`] = value;
      }
    }
    return flattenedDict;
}
  
async function getUniqueValues(arr: any, keys: any[]){
  const seen = new Set<string>();
  return arr.filter((dict: { [x: string]: any; }) => {
      const key = keys.map(k => dict[k]).join('|');
      if (seen.has(key)) {
          return false;
      } else {
          seen.add(key);
          return true;
      }
  });
}
async function innerJoin(arr1: any[], arr2: any[], key1: string, key2: string) {
    const result: any[] = [];
    const map = new Map();
  
    arr2.forEach(item => {
      const key = item[key2];
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(item);
    });
  
    arr1.forEach(item => {
      const key = item[key1];
      if (map.has(key)) {
        map.get(key).forEach((matchedItem: any) => {
          result.push({ ...item, ...matchedItem });
        });
      }
    });
  
    return result;
}

export async function VerifySearch_2(searchRequest: string) {

     
      const summaryPayload = JSON.stringify({
        search: searchRequest,
        orderby: "search.score() desc"
      });


    const summary_settings = {  
        method: "POST",  
        headers: {  
          "api-key": process.env.AI_SEARCH_KEY!,  
          "Content-Type": "application/json"  
        },  
        body: summaryPayload 
      }; 
    
    const summary_url =  process.env.AI_SEARCH_ENDPOINT! + '/indexes/metadata-index-data/docs/search?api-version=2024-05-01-preview'
    

    const searchResults = await fetch(summary_url, summary_settings); 
    if (!searchResults.ok) {  
      throw new Error(`HTTP error! status: ${searchResults.status}`);  
    }  
    
    
    const data_searchResults: any = await searchResults.json();
    const joinedData = await removeSearchStrings(data_searchResults.value);


    return joinedData;
};
  


export async function VerifySearch(searchRequest: string) {

    const chunksPayload = JSON.stringify({
        vectorQueries: [
          {
            kind: 'text',
            text: searchRequest,
            fields: 'embedding'
          }
        ],
        select: 'content, fileName'
    });
      
      const summaryPayload = JSON.stringify({
        search: searchRequest,
        vectorQueries: [
          {
            kind: 'text',
            text: searchRequest,
            fields: 'embedding'
          }
        ],
        select: 'fileName, content',
        queryType: 'semantic',
        semanticConfiguration: 'summary-semantic-config',
        captions: 'extractive',
        answers: 'extractive|count-3',
        queryLanguage: 'en-US'
      });


    const chunk_settings = {  
      method: "POST",  
      headers: {  
        "api-key": process.env.AI_SEARCH_KEY!,  
        "Content-Type": "application/json"  
      },  
      body: chunksPayload 
    }; 
  

    const summary_settings = {  
        method: "POST",  
        headers: {  
          "api-key": process.env.AI_SEARCH_KEY!,  
          "Content-Type": "application/json"  
        },  
        body: summaryPayload 
      }; 
    
    const summary_url =  process.env.AI_SEARCH_ENDPOINT! + '/indexes/summary-index/docs/search?api-version=2024-05-01-preview'
    const contracts_url =  process.env.AI_SEARCH_ENDPOINT! + '/indexes/contracts-index/docs/search?api-version=2024-05-01-preview'
    const table_url =  process.env.AI_SEARCH_ENDPOINT! + '/indexes/eager-answer-tablesindex/docs/search?api-version=2024-05-01-preview'
    const chunks_url =  process.env.AI_SEARCH_ENDPOINT! + '/indexes/chunk-index/docs/search?api-version=2024-05-01-preview'

    const searchResults = await fetch(summary_url, summary_settings); 
    if (!searchResults.ok) {  
      throw new Error(`HTTP error! status: ${searchResults.status}`);  
    }  

    
    
    const chunkResults = await fetch(chunks_url, chunk_settings); 
    if (!chunkResults.ok) {  
      throw new Error(`HTTP error! status: ${chunkResults.status}`);  
    }  
    const data_searchResults: any = await searchResults.json();
    const data_chunkResults: any = await chunkResults.json();

    const flattenedSummary = await Promise.all(
      data_searchResults.value.map((summ: any) => flattenCaptions(summ, '_summary'))
    );   
    let outputArray;

    if (data_chunkResults.value.length === 0) {
      // If data_chunkResults is empty, only process data_searchResults
      const joinedData = await removeSearchStrings(flattenedSummary);
      outputArray = await replaceScoreChunksKey(joinedData, '_summary');
    } else {
      // Normal process if data_chunkResults is not empty
      const flattenedChunks = await Promise.all(
        data_chunkResults.value.map((chunk: any) => flattenCaptions(chunk, '_chunks'))
      );
      const joinedData_ = await innerJoin(flattenedChunks, flattenedSummary, 'fileName_chunks', 'fileName_summary');
      const joinedData = await removeSearchStrings(joinedData_);
      outputArray = await replaceScoreChunksKey(joinedData, '_chunks');
    }

    const uniqueArray = await getUniqueValues(outputArray, ["fileName_chunks", "content_chunks"]);

    return uniqueArray;
};
  