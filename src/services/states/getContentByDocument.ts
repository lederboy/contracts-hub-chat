import { getContent } from "../../apis/content";
import { GetDocumentContentCallData, RunLLMWithContentCallData } from "./states";



export class GetDocumentContent {
    static async run(callData: GetDocumentContentCallData, contractsHubCredentials: {key: string,  endpoint: string}): Promise<RunLLMWithContentCallData> {
        const query = callData.query
            const document = callData.document
            const contentRes = await getContent(
                {query: query, document: document}, 
                contractsHubCredentials
            )
            return {
                state: 'RUN_LLM_WITH_CONTENT',
                session: callData.session,
                query: query,
                document: document,
                content: contentRes
            }
    }
}