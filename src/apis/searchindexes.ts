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

  const summary_url =  process.env.AI_SEARCH_ENDPOINT! + '/indexes/metadata-index/docs/search?api-version=2024-05-01-preview'
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

export async function VerifySearch(searchRequest: string, file_array: string[], type_search: string) {
  
  const semantic_config: { [key: string]: string } = {
    "summary-index": "summary-semantic-config",
    "json-index": "base",
    "contracts-index": "contracts-index-semantic-configuration",
    "table-index" : "table-semantic-config"
  }

  const select_type: { [key: string]: string } = {
    "summary-index": 'fileName, content',
    "json-index": 'fileName, content',
    "contracts-index": 'title, chunk',
    "table-index" : 'fileName, content'
  }


  const filter_type: { [key: string]: string } = {
    "summary-index": file_array.map(name => `fileName eq '${name.replace('.pdf', '')}'`).join(' or '),
    "json-index": file_array.map(name => `fileName eq '${name.replace('.pdf', '')}'`).join(' or '),
    "contracts-index": file_array.map(name => `title eq '${name}'`).join(' or '),
    "table-index" : file_array.map(name => `fileName eq '${name.replace('.pdf', '')}'`).join(' or ')
  }

  const vectorQueries_fields: { [key: string]: string } = {
    "summary-index": "embedding",
    "json-index": "embedding",
    "contracts-index": "text_vector",
    "table-index" : "embedding"
  }

  const Payload = JSON.stringify({
    search: searchRequest,
    select: select_type[type_search],
    filter: filter_type[type_search], 
    count: true,
    vectorQueries: [
      {
        kind: "text",
        text: searchRequest,
        fields: vectorQueries_fields[type_search]
      }
    ],    
    queryType: 'semantic',
    semanticConfiguration: semantic_config[type_search],
    captions: 'extractive',
    answers: 'extractive|count-3',
    queryLanguage: 'en-US'
  });

  const settings = {  
      method: "POST",  
      headers: {  
        "api-key": process.env.AI_SEARCH_KEY!,  
        "Content-Type": "application/json"  
      },  
      body: Payload 
    }; 
  let outputArray;
  let uniqueArray;

  const url =  process.env.AI_SEARCH_ENDPOINT! + '/indexes/' + type_search + '/docs/search?api-version=2024-05-01-preview'
  const searchResults = await fetch(url, settings); 
  if (!searchResults.ok) {  
    throw new Error(`HTTP error! status: ${searchResults.status}`);  
  }  

  
  const data_searchResults: any = await searchResults.json();

  const flattenedSummary_ = await Promise.all(
    data_searchResults.value.map((summ: any) => flattenCaptions(summ, '_summary'))
  );   
  
  if (data_searchResults.value.length === 0) {
    const joinedData = await removeSearchStrings(flattenedSummary_);
    outputArray = await replaceScoreChunksKey(joinedData, '_summary');
    uniqueArray = await getUniqueValues(outputArray, ["fileName_chunks", "content_chunks"]);
  } else {

    const flattenedSummary = removeFields(flattenedSummary_, [
      "@search.captions.highlights_summary",
      "@search.captions.text_summary"
    ]);
    const joinedData = await removeSearchStrings(flattenedSummary);
    outputArray = await replaceScoreChunksKey(joinedData, '_table');
    uniqueArray = outputArray
  }
  const summaries = uniqueArray.map((item: any) => ({
      content_summary: item.content_summary,
      fileName_summary: item.fileName_summary
  }));
  return summaries;
};
  
export async function Search_individual(searchRequest: string, document: string, type_search: string) {
  let outputArray;
  const semantic_config: { [key: string]: string } = {
    "summary-index": "summary-semantic-config",
    "json-index": "base",
    "contracts-index": "contracts-index-semantic-configuration",
    "table-index" : "table-semantic-config"
  }
  const filter_type: { [key: string]: string } = {
      "summary-index": `fileName eq '${document.replace('.pdf', '')}'`,
      "json-index": `fileName eq '${document.replace('.pdf', '')}'`,
      "contracts-index": `title eq '${document}'`,
      "table-index" : `fileName eq '${document}'`
  }

  const select_type: { [key: string]: string } = {
    "summary-index": 'fileName, content',
    "json-index": 'fileName, content',
    "contracts-index": 'title, chunk',
    "table-index" : 'fileName, content'
}

    
  const Payload = JSON.stringify({
    search: searchRequest,
    select: select_type[type_search],
    filter: filter_type[type_search], 
    queryType: 'semantic',
    semanticConfiguration: semantic_config[type_search],
    captions: 'extractive',
    answers: 'extractive|count-3',
    queryLanguage: 'en-US'
  });

  const settings = {  
      method: "POST",  
      headers: {  
        "api-key": process.env.AI_SEARCH_KEY!,  
        "Content-Type": "application/json"  
      },  
      body: Payload 
    }; 

  const url =  process.env.AI_SEARCH_ENDPOINT! + '/indexes/' + type_search + '/docs/search?api-version=2024-05-01-preview'
  const searchResults = await fetch(url, settings); 
  if (!searchResults.ok) {  
    throw new Error(`HTTP error! status: ${searchResults.status}`);  
  }  
   
  const data_searchResults: any = await searchResults.json();

  const flattenedValue_ = await Promise.all(
    data_searchResults.value.map((summ: any) => flattenCaptions(summ, ''))
  );   


  const flattenedResponse = removeFields(flattenedValue_, [
    "@search.captions.highlights",
    "@search.captions.text"
  ]);

  const EditedData = await removeSearchStrings(flattenedResponse);
  // outputArray = await replaceScoreChunksKey(EditedData, '');
  return EditedData;
};
  