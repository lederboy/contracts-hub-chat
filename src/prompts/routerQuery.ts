import { ChatRequestSystemMessage } from "@azure/openai";




export const RouterQuery: ChatRequestSystemMessage = {
    role: 'system',
    content: `
    Your job is to output an option specifying where to route the request. 
    The two options are "listContracts" and "singleContract". Only output one of those options.

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