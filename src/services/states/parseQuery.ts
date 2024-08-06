import { OpenAIClient } from "@azure/openai"
import {GetDocumentsCallData,NeedsMoreContextCallData,ParseQueryCallData} from "./states"
import { FilterQuery} from "../../prompts/searchQuery"
import { Search } from "./search"
import { SearchRequest } from "../../apis/search"








export class ParseSearchQuery {
    static async run(callData: ParseQueryCallData, openaiClient: OpenAIClient, deployment: string): Promise<GetDocumentsCallData> {
    
        const completion = await openaiClient.getChatCompletions(
                    'gpt-35-turbo',
                    [FilterQuery, {role: 'user', content: callData.query}],
                    {responseFormat: {type: "json_object"}}
        )
        let searchParams = []
        if(completion.choices.length > 0){
            let choice = completion.choices[0]
            if(choice.message){
                let message = choice.message
                if(message.content){
                    const json = JSON.parse(message.content)
                    if("searchParams" in json){
                        searchParams = json.searchParams
                    }
                }
            }
        }
        return {
            state: 'GET_DOCUMENTS',
            session: callData.session,
            query: callData.query,
            parsedQuery: {
                searchParams: searchParams,
            }
        }
        
    }
}
