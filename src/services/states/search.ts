import { getContent } from "../../apis/content";
import { searchContracts, SearchResponse } from "../../apis/search";
import { SearchCallData, AnswerFromSearchCallData, ModifyQueryCallData } from "./states";




export class Search {
    static async run(callData: SearchCallData, creds: {key: string, searchEndpoint: string, contentEndpoint: string}): Promise<AnswerFromSearchCallData>{
        const jsonsPerContract: Record<string, string> = {}


        for await(let doc of callData.documents){
            const vecSearchRes = await getContent({document: doc.replace('.pdf',''), query: callData.query}, {key: creds.key, endpoint: creds.contentEndpoint})
            const jsonResponses = vecSearchRes.jsons
            jsonsPerContract[doc] = JSON.stringify(jsonResponses)
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