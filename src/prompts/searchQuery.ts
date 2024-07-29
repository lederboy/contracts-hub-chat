import { ChatRequestSystemMessage } from "@azure/openai";

export const FilterQuery: ChatRequestSystemMessage = {
    role: "system",
    content: ` 
    Given a search query extract the relevant search fields from the query as a json.

    This is the interface definition you are going to use.
    SCHEMA:
    interface SearchParam {
        fieldName: string
        operatior: "==" | ">=" | "<=" | ">" | "<" | "LIKE" | "CONTAINS"
        value: string
    }
    interface Output: {
        searchParams: SearchParam[]
    }

    Here are the available fieldNames: 
    - medicareContract: only if query specifies medicare
    - effectiveDate: the date the contract becomes effective
    - chainOrNCPDPCodes: chain code or NCPDP code
    - company: company of interest

    Here are the examples that highlight how to use this interface
    EXAMPLES:
        input: "List all contracts with effective dates in 2024"
        output: {
            "searchParams": [
                {
                    "fieldName": "effectiveDate",
                    "operator": "==",
                    "value": "2024"
                }
            ]
        }
        input: "List all contracts with effective dates after 2020"
        output: {
            "searchParams": [
                {
                    "fieldName": "effectiveDate",
                    "operator": ">",
                    "value": "2020"
                }
            ]
        }
        input: "List all contracts with effective dates between 2020 and 2023"
        output: {
            "searchParams": [
                {
                    "fieldName": "effectiveDate",
                    "operator": ">",
                    "value": "2020"
                },
                {
                    "fieldName": "effectiveDate",
                    "operator": "<=",
                    "value": "2023"
                }
            ]
        }
        input: "Give me walgreens contracts"
        output: {
            "searchParams": [
                {
                    "fieldName": "company",
                    "operator": "LIKE",
                    "value": "walgreens"
                }
            ]  
        }

        input: "List all with Chain Code 008, 009"
        output: {
            "searchParams": [
                {
                    "fieldName": "chainOrNCPDPCodes",
                    "operator": "CONTAINS",
                    "value": "008,009"
                }
            ]
        }
        input: "List all contracts with Chain Code 234 and effective date year is 2023"
        output: {
            "searchParams": [
                {
                    "fieldName": "chainOrNCPDPCodes",
                    "operator": "CONTAINS",
                    "value": "234"
                },
                {
                    "fieldName": "effectiveDate",
                    "operator": "==",
                    "value": "2023"
                }
            ]
        }
        input: "Give me all chain codes and fileNames from 2024 medicare contracts
        output: {
            "searchParams": [
                {
                    "fieldName": "effectiveDate",
                    "operator": "==",
                    "value": "2024"
                },
                {
                    "fieldName": "medicareContract",
                    "operator": "==",
                    "value": "true"  
                }
            ]
        }

        input: "List all chain codes from cvs contracts after 2023"
        output : {
            "searchParams": [
                {
                    "fieldName": "company",
                    "operator": "LIKE",
                    "value": "CVS"
                },
                {
                    "fieldName": "effectiveDate",
                    "operator": ">",
                    "value": "2023"
                
                }
            ]
        }

        input: "Give me all chain codes with an active medicare agreement"
        output: {
            "searchParams": [
                {
                    "fieldName": "medicareContract",
                    "operator": "==",
                    "value": "true"
                }
            ]
        }
        ` 
}