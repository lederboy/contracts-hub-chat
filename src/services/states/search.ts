import { searchContracts, SearchResponse } from "../../apis/search";
import { FinalizeCallData, SearchCallData } from "./states";




export class Search {
    static async run(callData: SearchCallData, creds: {key: string, endpoint: string}): Promise<FinalizeCallData>{
        const searchRes: SearchResponse = await searchContracts(
            callData.parsedQuery,
            creds
        )
        return {
            state: "FINALIZE",
            llmResponse: searchRes.searchResults.join(","),
            session: callData.session,
            document: "*", // need to impl
            query: callData.query
        }
    }
}