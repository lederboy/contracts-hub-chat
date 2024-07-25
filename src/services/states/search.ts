import { GetContentResponse } from "../../apis/content";
import { searchContracts, SearchResponse } from "../../apis/search";
import { RunLLMWithContentCallData, SearchCallData } from "./states";




export class Search {
    static async run(callData: SearchCallData, creds: {key: string, endpoint: string}): Promise<RunLLMWithContentCallData>{
        const searchRes: SearchResponse = await searchContracts(
            callData.parsedQuery,
            creds
        )
        let contents = searchRes.searchResults.map((sRes) => {
            return {
                chunks: [""],
                summary: "",
                json: sRes
            }
        })
        return {
            state: "RUN_LLM_WITH_CONTENT",
            contents: contents,
            session: callData.session,
            documents: searchRes.searchResults.map(sRes => sRes.fileName), // need to impl
            query: callData.query
        }
    }
}