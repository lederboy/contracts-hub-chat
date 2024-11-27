import { ChatHistory } from './../session';
import { OpenAIClient, ChatRequestMessage, ChatRequestSystemMessage  } from "@azure/openai";
import { AnswerQueryFromSearchPrompt,CustomChatRequestMessage } from "../../prompts/formatSearchQuery";
import { AnswerFromSearchCallData, AnswerFromSearchCallDataIndex, EvaluateCallData } from "./states";
import { encode } from 'gpt-3-encoder';

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

export class AnswerQueryFromSearch {
    static formatUserPrompt(mapping: any, query: string, ChatHistory: Message[], contractType: string): string {
        let highestChatOrderMessage;
        let highestOutgoingChatOrderMessage;
        if (ChatHistory.length > 0){
            const incomingMessages = ChatHistory.filter(message => message.direction === 'incoming');
            highestChatOrderMessage = incomingMessages.reduce((prev, current) => (prev.chatOrder > current.chatOrder) ? prev : current);
            
            const outgoingMessages = ChatHistory.filter(message => message.direction === 'outgoing');
            highestOutgoingChatOrderMessage = outgoingMessages.reduce((prev, current) => (prev.chatOrder > current.chatOrder) ? prev : current);
            // temp_query += highestOutgoingChatOrderMessage.content
        }
        // temp_query += ' ' + query
        const historicalContextString = ChatHistory.length > 0 ? `
                Historical Context:
                    ${JSON.stringify(highestChatOrderMessage)}
        ` : '';
        
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
            mappingStrings = Object.keys(mapping).map((k) => `\t${k} -> ${mapping[k]}`)
        }
        

        return `        
        Using the Inferred Buisness Model and any available historical context, respond to the user's User Query. 
        ${historicalContextString}
        Inferred Buisness Model:
          ${mappingStrings.join('\n')}
        User Query: ${query}
        Guidelines for Response:
            1. Tailor the response based on the User Query and Inferred Buisness Model.
            2. If multiple documents or files are relevant, include all in the response in a organized miner.
            3. If no relevant historical context or Inferred Buisness Model exist, attempt to answer the User Query while notifying the user of the absence of information in the Inferred Buisness Model.
            4. Enclose references to files in .pdf format or specific documents in angle brackets, such as <contract.pdf> or <contract>.
            5. Format any data-centric portions of the response as a Markdown table.
            6. If their is a historical context available, use it as a guide to respone the user query based on the historical context and the Inferred Buisness Model.
        `
    }
    static async run(callData: AnswerFromSearchCallData, openaiClient: OpenAIClient, deployment: string, overrideDeployment: boolean = false): Promise<EvaluateCallData> { 
        const helpText = ""//"\nWe hope you find the information provided helpful! Please note that our system is designed to display a maximum of the top 10 results to ensure clarity and relevance. If you need further details beyond these results, feel free to reach out with more specific queries or adjust your search criteria to explore additional information. Thank you for understanding!"
        const response_ = this.formatUserPrompt(callData.searchResponse, callData.query, callData.session.chatHistory, callData.session.contractType)
        const tokenLimit = 4096;
        const isExceeding = isTokenCountExceedingLimit(response_, tokenLimit);
        let chat_history = callData.session.chatHistory.slice(Math.max(callData.session.chatHistory.length - 2, 0))
        const convertedArray = convertEntries(chat_history);
        let prompt_chat: CustomChatRequestMessage[] = [AnswerQueryFromSearchPrompt, ...convertedArray];
        
        if (overrideDeployment && isExceeding) {
            deployment = 'gpt-4';
        }else{
            deployment = 'gpt-35-turbo';
        }
        console.log(deployment)
        const completion = await openaiClient.getChatCompletions(
            deployment,
            prompt_chat.concat([{role: 'user', content: response_}]),
            {temperature: 0.0}
        )

        if(completion.choices.length > 0){
           let choice = completion.choices[0]
           if(choice.message){
            let message = choice.message

            if(message.content){
                // const patternString = `([^\\/]+\\.pdf)`;
                const patternString = /<([^>]+\.pdf)>/g;
                const pdfPattern = new RegExp(patternString, 'g');
                let filenames: string[] = [];
                let match;

                // while ((match = regex.exec(message.content)) !== null) {
                //     filenames.push(match[2]);
                // }
                while ((match = pdfPattern.exec(message.content)) !== null) {
                    filenames.push(match[1]);
                }
                if (filenames.length === 0){
                    filenames  = [...processDocuments(callData, message.content), ...filenames]
                }
                const cleanedFilenames: string[] = filenames.map(filename => filename.replace("**", ""));
                const uniqueFilenames = Array.from(new Set(cleanedFilenames));
                
                let prefixedFilenames = uniqueFilenames.map(filename => `${callData.session.contractType}/${filename}`);

                callData.documents = Array.from(prefixedFilenames);
                const result = message.content.replace(pdfPattern, (match, p1) => p1);
                const patternString_2 = `${callData.session.contractType}\/([^\/]+\.pdf)`;
                const pdfPattern_2 = new RegExp(patternString_2, 'g');
                const result_value = result.replace(pdfPattern_2, (match, p1) => p1) ;
                
                return {
                    state: 'EVALUATE',
                    session: callData.session,
                    documents: callData.documents,
                    query: callData.query,
                    llmResponse: result_value + helpText
                }
            }
           }
        }
        throw Error('Error Completing Query')
    }
}