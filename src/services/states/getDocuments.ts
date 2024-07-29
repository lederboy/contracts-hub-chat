import { searchContracts, SearchResponse } from "../../apis/search";
import { NeedsMoreContext } from "./needsMoreContext";
import { GetDocumentsCallData, NeedsMoreContextCallData, SearchCallData } from "./states";


export class GetDocuments {
    static async run(callData: GetDocumentsCallData,  creds: {key: string, endpoint: string}): Promise<SearchCallData | NeedsMoreContextCallData> {
        
        try{
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
        catch(err){
            return  {
                state: 'NEEDS_MORE_CONTEXT',
                session: callData.session,
                query: callData.query
            }
        }
    }
}