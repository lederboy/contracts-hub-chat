import { ChatRequestSystemMessage } from "@azure/openai";


export const NeedsMoreContextQuery: ChatRequestSystemMessage = {
    role: 'system',
    content: `
        You are given a query that does not have enough context. The context you need is from any of these fields:
        - medicareContract: only if query specifies medicare
        - effectiveDate: the date the contract becomes effective
        - chain code: chain code or NCPDP code
        - company: company of interest

        You must explain to the user in a sicinct manner why the query is lacking context.

    `
}