import { searchContracts, SearchResponse } from "../../apis/search";
import { GetDocumentsCallData, SearchCallData } from "./states";


export class GetDocuments {
    static async run(callData: GetDocumentsCallData,  creds: {key: string, endpoint: string}): Promise<SearchCallData> {
        const searchRes: SearchResponse = await searchContracts(
            callData.parsedQuery,
            creds
        )
        return {
            state: 'SEARCH',
            documents: searchRes.documents,
            session: callData.session,
            query: callData.query
        }
    }
}