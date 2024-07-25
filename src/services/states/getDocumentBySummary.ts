import { getBySummary } from "../../apis/summary";
import { GetDocumentContentCallData, GetDocumentFromSummaryCallData } from "./states";


export class GetDocumentFromSummary {
    static async run(callData: GetDocumentFromSummaryCallData, contractsHubCredentials: {key: string, endpoint: string}): Promise<GetDocumentContentCallData> {
        const query = callData.modifiedQuery
        let documents: string[]
        if(callData.session.documents.length > 0){
            documents = callData.session.documents.slice(0,2)
        }else{
            const docRes = await getBySummary(
                {query: query}, 
                contractsHubCredentials
            )
            documents = docRes.probableDocuments.slice(0,2)
        }
        return {
            state: 'GET_DOCUMENT_CONTENT',
            session: callData.session,
            query: query,
            documents: documents
        }
    }
}