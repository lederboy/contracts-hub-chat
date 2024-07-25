import { ChatRequestSystemMessage } from "@azure/openai";




export const RouterQuery: ChatRequestSystemMessage = {
    role: 'system',
    content: `
    Whenever I ask you a question, I need you to define which of the following routes you will take based on the explanation given for each route:
    The two options are "listContracts" and "singleContract".

    For any ambiguous queries that might fit either route, default to 'singleContract'. Only respond with one of the routes defined and explained.

    examples:
        input: "List all contracts with effective date in 2024"
        output: "listContracts"

        input: "List all contracts that mention flu vaccines"
        output: "listContracts"

        input "Give me Walgreens contracts"
        output: "listContracts"

        input: "What is the definition of Specialty Drugs?"
        output: "singleContract"

        input: "What are the drug prices for caremark in 2024?"
        output: "singleContract"

        input: "What are the brand rates for CVS Specialty drugs in 2023"
        output: "singleContract"
    `
}