import axios from 'axios'

export interface GetSummaryRequest {
    query: string
}
export interface GetDocumentResponse {
    probableDocuments: string[]
}
export class GetSummaryError extends Error {}
export const getBySummary = async (payload: {query: string}, api: {endpoint: string, key: string}) => {
    const res = await axios.post<GetDocumentResponse>(api.endpoint, payload, {
        headers: {
            'Ocp-Apim-Subscription-Key': api.key
        }
    })
    if(res.status === 200){
        return res.data
    }
    throw new GetSummaryError(`status: ${res.status}`)
    
}

