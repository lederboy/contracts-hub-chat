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
  
    // arr1.forEach(item => {
    //   const key = item[key1].replace('contracts/contracts/', '');
    //   if (map.has(key)) {
    //     map.get(key).forEach((matchedItem: any) => {
    //       result.push({ ...item, ...matchedItem });
    //     });
    //   }
    // });

    const matchedKeys = new Set();
    arr1.forEach(item => {
      const key = item[key1].replace('contracts/contracts/', '');
      if (map.has(key)) {
        matchedKeys.add(key);
        map.get(key).forEach((matchedItem: any) => {
          result.push({ ...item, ...matchedItem });
        });
      } else {
        // No match found in arr2, include item from arr1 with null for unmatched parts
        result.push({ ...item, ...Object.fromEntries(Object.keys(arr2[0] || {}).map(k => [k, null])) });
      }
    });
  
    arr2.forEach(item => {
        const key = item[key2];
        if (!matchedKeys.has(key)) {
            result.push({ ...item });
        }
    });

    return result;
}


  

function formatFileNames(fileNames: string[], prefix: string = '', suffix: string = ''): string {
  const formattedNames = fileNames.map(fileName => `${prefix}${fileName.replace('.pdf', '')}${suffix}`);
  const formattedString = formattedNames.map(name => `fileName eq '${name}'`).join(' or ');
  
  return formattedString;
}

interface Dictionary {
  [key: string]: any[];
}

const removeFields = (array: Dictionary[], fields: string[]): Dictionary[] => {
  return array.map((dictionary: Dictionary) => {
    const newDictionary = { ...dictionary };
    fields.forEach(field => {
      delete newDictionary[field];
    });
    return newDictionary;
  });
};


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
  let joinedData = await removeSearchStrings(data_searchResults.value);
  joinedData = joinedData.map((item: { [x: string]: any; AzureSearch_DocumentKey: any; }) => {
    const { AzureSearch_DocumentKey, ...rest } = item;
    return rest;
  });
  return joinedData;
};

export async function VerifySearch(searchRequest: string, file_array: string[]) {
  let formattedString = '';
  let formattedString_table = '';
  let outputArray;
  let uniqueArray;
  if (file_array.length===0){
    formattedString = formatFileNames(file_array);
    formattedString_table = formatFileNames(file_array, 'contracts/contracts/');
  }

  // const chunksPayload = JSON.stringify({
  //     vectorQueries: [
  //       {
  //         kind: 'text',
  //         text: searchRequest,
  //         fields: 'embedding'
  //       }
  //     ],
  //     select: 'content, fileName',
  //     filter : formattedString
  // });
    
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
    filter: formattedString, 
    queryType: 'semantic',
    semanticConfiguration: 'summary-semantic-config',
    captions: 'extractive',
    answers: 'extractive|count-3',
    queryLanguage: 'en-US'
  });


  const tablePayload = JSON.stringify({
    search: searchRequest,
    queryType: "semantic",
    semanticConfiguration: "table-semantic-config",
    captions: "extractive",
    answers: "extractive|count-3",
    queryLanguage: "en-US",
    filter: formattedString_table,
    select: "content, fileName"
  });


  // const chunk_settings = {  
  //   method: "POST",  
  //   headers: {  
  //     "api-key": process.env.AI_SEARCH_KEY!,  
  //     "Content-Type": "application/json"  
  //   },  
  //   body: chunksPayload 
  // }; 


  const summary_settings = {  
      method: "POST",  
      headers: {  
        "api-key": process.env.AI_SEARCH_KEY!,  
        "Content-Type": "application/json"  
      },  
      body: summaryPayload 
    }; 

  const table_settings = {  
      method: "POST",  
      headers: {  
        "api-key": process.env.AI_SEARCH_KEY!,  
        "Content-Type": "application/json"  
      },  
      body: tablePayload 
    }; 
  
    
  const summary_url =  process.env.AI_SEARCH_ENDPOINT! + '/indexes/summary-index/docs/search?api-version=2024-05-01-preview'
  const table_url =  process.env.AI_SEARCH_ENDPOINT! + '/indexes/table-index/docs/search?api-version=2024-05-01-preview'
  // const chunks_url =  process.env.AI_SEARCH_ENDPOINT! + '/indexes/chunk-index/docs/search?api-version=2024-05-01-preview'

  const searchResults = await fetch(summary_url, summary_settings); 
  if (!searchResults.ok) {  
    throw new Error(`HTTP error! status: ${searchResults.status}`);  
  }  

  
  const tablesearchResults = await fetch(table_url, table_settings); 
  if (!tablesearchResults.ok) {  
    throw new Error(`HTTP error! status: ${tablesearchResults.status}`);  
  }  

    
    
  // const chunkResults = await fetch(chunks_url, chunk_settings); 
  // if (!chunkResults.ok) {  
  //   throw new Error(`HTTP error! status: ${chunkResults.status}`);  
  // }  

  const data_searchResults: any = await searchResults.json();
  // const data_chunkResults: any = await chunkResults.json();
  const data_tableResults: any = await tablesearchResults.json();

  const flattenedSummary_ = await Promise.all(
    data_searchResults.value.map((summ: any) => flattenCaptions(summ, '_summary'))
  );   
  
  if (data_tableResults.value.length === 0) {
    const joinedData = await removeSearchStrings(flattenedSummary_);
    outputArray = await replaceScoreChunksKey(joinedData, '_summary');
    uniqueArray = await getUniqueValues(outputArray, ["fileName_chunks", "content_chunks"]);
  } else {
    const flattenedTables__ = await Promise.all(
      data_tableResults.value.map((table: any) => flattenCaptions(table, '_table'))
    );
    const flattenedTables_ = await getUniqueValues(flattenedTables__, ["fileName", "@search.captions.text_table"]);
    const flattenedTables = removeFields(flattenedTables_, [
      "@search.captions.highlights_table",
      "@search.captions.text_table"
    ]);

    const flattenedSummary = removeFields(flattenedSummary_, [
      "@search.captions.highlights_summary",
      "@search.captions.text_summary"
    ]);

    const joinedData_ = await innerJoin(flattenedTables, flattenedSummary, 'fileName_table', 'fileName_summary');     
    const joinedData = await removeSearchStrings(joinedData_);
    outputArray = await replaceScoreChunksKey(joinedData, '_table');
    uniqueArray = outputArray
  }
  return uniqueArray;
};
  