import { OpenAIClient } from "@azure/openai";
import { FinalizeCallData, LLMRouterCallData, ModifyQueryCallData, ParseQueryCallData} from "./states";
import { ModifyQueryWithHistory } from "./modifyQueryWithHistory";
import { RouterQuery } from "../../prompts/routerQuery";





export class LLMRouter {

    static async run(callData: LLMRouterCallData, openaiClient: OpenAIClient, deployment: string): Promise<ModifyQueryCallData | ParseQueryCallData> {
    
        const completion = await openaiClient.getChatCompletions(
            deployment,
            [RouterQuery, {role: 'user', content: callData.query}],
        )

        if(completion.choices.length > 0){
           let choice = completion.choices[0]
           if(choice.message){
            let message = choice.message
            if(message.content){
                let content = message.content
                if(content.includes("listContracts")){
                    return {
                        state: "PARSE_SEARCH_QUERY",
                        query: callData.query,
                        session: callData.session
                    }
                }else{
                    return {
                        state: "MODIFY_QUERY_WITH_HISTORY",
                        query: callData.query,
                        session: callData.session
                    }
                }
            }
           }
        }
        throw Error('Error Completing Query')
    }
}