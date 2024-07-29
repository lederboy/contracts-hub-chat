import { getContent } from "../../apis/content";
import { searchContracts, SearchResponse } from "../../apis/search";
import { SearchCallData, AnswerFromSearchCallData, ModifyQueryCallData } from "./states";




export class Search {
    static async run(callData: SearchCallData, creds: {key: string, searchEndpoint: string, contentEndpoint: string}): Promise<AnswerFromSearchCallData>{
        const jsonsPerContract: Record<string, string> = {}
        const documents = callData.documents
        const vectorSearchRequests = documents.map(async doc => {
            return await getContent({
                document: doc.replace('.pdf',''), query: callData.query}, 
                {key: creds.key, endpoint: creds.contentEndpoint}
            )
        })
        const vectorSearchResponses = await Promise.all(vectorSearchRequests)
        for (let i = 0; i < documents.length; i++){
            const vecSearchRes = vectorSearchResponses[i]
            if (documents.length === 1){
                jsonsPerContract[documents[i]] = JSON.stringify(vecSearchRes)
            } else {
                const jsonResponses = vecSearchRes.jsons
                jsonsPerContract[documents[i]] = JSON.stringify(jsonResponses)
            }
            
        }
        return {
            state: "ANSWER_FROM_SEARCH",
            searchResponse: jsonsPerContract,
            session: callData.session,
            documents: callData.documents,
            query: callData.query
        }
    }
}
