import { getContent } from "../../apis/content";
import { GetDocumentContentCallData, RunLLMWithContentCallData } from "./states";



export class GetDocumentContent {
    static async run(callData: GetDocumentContentCallData, contractsHubCredentials: {key: string,  endpoint: string}): Promise<RunLLMWithContentCallData> {
        const query = callData.query
        const contents = []
        for(let document of callData.documents){
            const contentRes = await getContent(
                {query: query, document: document}, 
                contractsHubCredentials
            )
            contents.push(contentRes)
        }
        return {
            state: 'RUN_LLM_WITH_CONTENT',
            session: callData.session,
            query: query,
            documents: callData.documents,
            contents: contents 
        }

    }
}