import { ChatHistory } from './../session';
import { OpenAIClient, ChatRequestMessage, ChatRequestSystemMessage  } from "@azure/openai";
import { AnswerQueryFromGenericQuestion, CustomChatRequestMessage } from "../../prompts/formatSearchQuery";
import { AnswerFromSearchCallData, AnswerFromSearchCallDataIndex, EvaluateCallData, GenericSearchCallDataIndex } from "./states";
import { encode } from 'gpt-3-encoder';
import {GetIndexInfo} from './searchIndexes'

function isTokenCountExceedingLimit(text: string, limit: number = 4096): boolean {
    const tokens = encode(text);
    return tokens.length > limit;
}  
interface CallData {
    documents: string[];
}
interface Message {
    direction: string;
    content: string;
    chatOrder: number;
    documents?: any[];
    score?: string;
  }

interface OriginalEntry {
    direction: string;
    content: string;
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
function convertEntries(entries: OriginalEntry[]): CustomChatRequestMessage [] {
    return entries.map((entry: OriginalEntry) => ({
        role: entry.direction === 'outgoing' ? 'user' : 'assistant',
        content: entry.content
    }));
}

export class AnswerQueryFromGenericResponse {
    static formatUserPrompt(mapping: any, query: string,): string {
        // let highestChatOrderMessage;
        // let highestOutgoingChatOrderMessage;
        // if (ChatHistory.length > 0){
        //     const incomingMessages = ChatHistory.filter(message => message.direction === 'incoming');
        //     highestChatOrderMessage = incomingMessages.reduce((prev, current) => (prev.chatOrder > current.chatOrder) ? prev : current);
            
        //     const outgoingMessages = ChatHistory.filter(message => message.direction === 'outgoing');
        //     highestOutgoingChatOrderMessage = outgoingMessages.reduce((prev, current) => (prev.chatOrder > current.chatOrder) ? prev : current);
        //     // temp_query += highestOutgoingChatOrderMessage.content
        // }
        // // temp_query += ' ' + query
        // const historicalContextString = ChatHistory.length > 0 ? `
        //         Historical Context:
        //             ${JSON.stringify(highestChatOrderMessage)}
        // ` : '';
        
        // let mappingStrings;
        let mappingStrings: string[] = [];
        if (Array.isArray(mapping)){
            // mappingStrings = Object.keys(mapping).map((k) => `${k} -> ${mapping[k]}`)
            mapping.forEach(dictionary => {
                for (const key in dictionary) {
                  if (dictionary.hasOwnProperty(key)) {
                    const value = dictionary[key];
                    const mappingString = `${key} -> ${value}`;
                    mappingStrings.push(mappingString);
                  }
                }
              });
        }else{
            mappingStrings = Object.keys(mapping).map((k) => `${k} -> ${mapping[k]}`)
        }
        

        return `       
        You are going to respond to the QUESTION: using the information provided in the CONTEXT. 
        Please look into this CONTEXT to understand and have a reference to respond to the QUESTION asked by the user.
        CONTEXT:
            ${mappingStrings.join('\n')}
        QUESTION:
            ${query}
        
        
        `
    }
    static async run(callData: GenericSearchCallDataIndex, openaiClient: OpenAIClient, deployment: string, overrideDeployment: boolean = false): Promise<EvaluateCallData> {
        
        
        const context = await GetIndexInfo.execute(callData, openaiClient, deployment);
        context.forEach(item => {
            item.fileName += '.pdf';
          });
        const response_ = this.formatUserPrompt(context, callData.query)
        const tokenLimit = 4096;
        const isExceeding = isTokenCountExceedingLimit(response_, tokenLimit);
        let chat_history = callData.session.chatHistory.slice(Math.max(callData.session.chatHistory.length - 2, 0))
        const convertedArray = convertEntries(chat_history);
        let prompt_chat: CustomChatRequestMessage[] = [AnswerQueryFromGenericQuestion, ...convertedArray];
        if (overrideDeployment && isExceeding) {
            deployment = 'gpt-4o';
        }else{
            deployment = 'gpt-35-turbo';
        }
        console.log(deployment)
        const completion = await openaiClient.getChatCompletions(
            deployment,
            prompt_chat.concat([{role: 'user', content: response_}]),
            {temperature: 0.1}
        )

        if(completion.choices.length > 0){
           let choice = completion.choices[0]
           if(choice.message){
            let message = choice.message

            if(message.content){
                const regex = /(\d+\.\s)(.*?\.pdf)/g;
                // const pdfPattern = /<([^>]+\.pdf)>/g;
                const pdfPattern = /<pharmacy\/([^\/]+\.pdf)>/g;
                let filenames: string[] = [];
                let match;
                while ((match = pdfPattern.exec(message.content)) !== null) {
                    filenames.push(match[1]);
                }
                if (filenames.length === 0){
                    filenames  = [...processDocuments(callData, message.content), ...filenames]
                }
                const cleanedFilenames: string[] = filenames.map(filename => filename.replace("**", ""));
                const uniqueFilenames = Array.from(new Set(cleanedFilenames));
                // const updatedDocumentsSet: Set<string> = new Set([...callData.documents, ...uniqueFilenames]);
                let prefixedFilenames = uniqueFilenames.map(filename => `pharmacy/${filename}`);

                callData.documents = Array.from(prefixedFilenames);


                return {
                    state: 'EVALUATE',
                    session: callData.session,
                    documents: callData.documents,
                    query: callData.query,
                    llmResponse: message.content
                }
            }
           }
        }
        throw Error('Error Completing Query')
    }
}