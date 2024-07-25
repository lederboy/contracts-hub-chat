import { getBySummary } from "../../apis/summary";
import { GetDocumentContentCallData, GetDocumentFromSummaryCallData } from "./states";


export class GetDocumentFromSummary {
    static async run(callData: GetDocumentFromSummaryCallData, contractsHubCredentials: {key: string, endpoint: string}): Promise<GetDocumentContentCallData> {
        const query = callData.modifiedQuery
        let document: string
        if(callData.session.documents.length > 0){
            document = callData.session.documents[0]
        }else{
            const docRes = await getBySummary(
                {query: query}, 
                contractsHubCredentials
            )
            document = docRes.probableDocuments[0]
        }
        return {
            state: 'GET_DOCUMENT_CONTENT',
            session: callData.session,
            query: query,
            document: document
        }
    }
}