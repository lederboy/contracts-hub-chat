import { OpenAIClient } from "@azure/openai"
import {GetDocumentsCallData,ParseQueryCallData} from "./states"
import { FilterQuery, SelectQuery } from "../../prompts/searchQuery"
import { Search } from "./search"








export class ParseSearchQuery {
    static async run(callData: ParseQueryCallData, openaiClient: OpenAIClient, deployment: string): Promise<GetDocumentsCallData> {
    
        const completions = [
                openaiClient.getChatCompletions(
                    deployment,
                    [FilterQuery, {role: 'user', content: callData.query}],
                    {responseFormat: {type: "json_object"}}
                ),
                openaiClient.getChatCompletions(
                    deployment,
                    [SelectQuery, {role: 'user', content: callData.query}],
                    {responseFormat: {type: "json_object"}}
                ),
        ]
        let responses: any = {
            selectParams: [],
            searchParams: []
        }
        for await (let completion of completions){
            if(completion.choices.length > 0){
                let choice = completion.choices[0]
                if(choice.message){
                 let message = choice.message
                 if(message.content){
                    const json = JSON.parse(message.content)
                    if("selectParams" in  json){
                        responses.selectParams = json.selectParams
                    } else if("searchParams" in json){
                        responses.searchParams = json.searchParams
                    }
                 }
                }
             }
        }
        return {
            state: 'GET_DOCUMENTS',
            session: callData.session,
            query: callData.query,
            parsedQuery: {
                searchParams: responses.searchParams,
                selectParams: []
            }
        }

        // throw Error('Error Completing Query')
    }
}
