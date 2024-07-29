import axios from 'axios'
export interface GetContentRequest {
    document: string
    query: string
}
export interface GetContentJSONs {
    score: number
    document: {
        content: any
    }
}
export interface GetContent {
    score: number
    document: {
        content: string
    }
}
export interface GetContentResponse {
    jsons: any[]
    chunks: string[]
    summary: string
}
export class GetContentError extends Error {}


export const getContent = async (payload: GetContentRequest, api: {endpoint: string, key: string}) => {
    const res = await axios.post<GetContentResponse>(api.endpoint, payload, {
        headers: {
            'Ocp-Apim-Subscription-Key': api.key
        }
    })
    if(res.status === 200){
        return res.data
    }
    throw new GetContentError(`status: ${res.status}`)
}

