import { OpenAIClient } from "@azure/openai";
import { AnswerQueryFromSearchPrompt, } from "../../prompts/formatSearchQuery";
import { AnswerFromSearchCallData, AnswerFromSearchCallDataIndex, FinalizeCallData } from "./states";
import { encode } from 'gpt-3-encoder';

function isTokenCountExceedingLimit(text: string, limit: number = 4096): boolean {
    const tokens = encode(text);
    return tokens.length > limit;
}

interface CallData {
    documents: string[];
}

function removeSpaces(input: string): string {
    return input.replace(/\s+/g, '');
}

function processDocuments(callData: CallData, response: string): string[] {
    // Create a mapping of processed document names to original document names
    const documentMap: Record<string, string> = {};

    callData.documents.forEach(doc => {
        documentMap[removeSpaces(doc)] = doc;
    });

    // Remove spaces from the response string
    const processedResponse = removeSpaces(response);

    // Create an array to store matching original document names
    const matchingDocuments: string[] = [];

    // Check if the processed response contains any of the processed documents
    for (const processedDoc in documentMap) {
        if (processedResponse.includes(processedDoc)) {
            matchingDocuments.push(documentMap[processedDoc]);
        }
    }

    return matchingDocuments;
}


export class AnswerQueryFromSearch {
    static formatUserPrompt(mapping: Record<string, string>, query: string): string {
        let mappingStrings = Object.keys(mapping).map((k) => `${k} -> ${mapping[k]}`)
        return `
        Query:
            ${query}
        Mappings:
            ${mappingStrings.join('\n')}
        
        `
    }
    static async run(callData: AnswerFromSearchCallData, openaiClient: OpenAIClient, deployment: string, overrideDeployment: boolean = false): Promise<FinalizeCallData> {
        const response_ = this.formatUserPrompt(callData.searchResponse, callData.query)
        const tokenLimit = 4096;
        const isExceeding = isTokenCountExceedingLimit(response_, tokenLimit);
        
        if (overrideDeployment && isExceeding) {
            deployment = 'gpt-4o';
        }else{
            deployment = 'gpt-35-turbo';
        }
        console.log(deployment)
        const completion = await openaiClient.getChatCompletions(
            deployment,
            [AnswerQueryFromSearchPrompt, {role: 'user', content: response_}],
            {temperature: 0.0}
        )

        if(completion.choices.length > 0){
           let choice = completion.choices[0]
           if(choice.message){
            let message = choice.message

            if(message.content){
                const regex = /(\d+\.\s)(.*?\.pdf)/g;
                const pdfPattern = /<([^>]+\.pdf)>/g;
                let filenames: string[] = [];
                let match;

                while ((match = regex.exec(message.content)) !== null) {
                    filenames.push(match[2]);
                }
                while ((match = pdfPattern.exec(message.content)) !== null) {
                    filenames.push(match[1]);
                }
                if (filenames.length === 0){
                    // const matchingDocuments = processDocuments(callData, message.content);
                    filenames  = [...processDocuments(callData, message.content), ...filenames]
                }
                const cleanedFilenames: string[] = filenames.map(filename => filename.replace("**", ""));
                const uniqueFilenames = Array.from(new Set(cleanedFilenames));
                
                


                return {
                    state: 'FINALIZE',
                    session: callData.session,
                    documents: uniqueFilenames,
                    query: callData.query,
                    llmResponse: message.content
                }
            }
           }
        }
        throw Error('Error Completing Query')
    }
}