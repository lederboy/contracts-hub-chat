import axios from 'axios'

export interface SearchRequest {
    searchParams: Record<string,any>[],
    selectParams: Record<string,any>[]
}
export interface SearchResponse {
    columns: Record<string, string[]>
    documents: string[]
}
export class SearchError extends Error {}
export const searchContracts = async (payload: SearchRequest, api: {endpoint: string, key: string}) => {
    const res = await axios.post<SearchResponse>(api.endpoint, payload, {
        headers: {
            'Ocp-Apim-Subscription-Key': api.key
        }
    })
    if(res.status === 200){
        return res.data
    }
    throw new SearchError(`status: ${res.status}`)
    
}
