import { ChatHistory } from './../services/session';
import {z} from 'zod'



export const ChatSessionSchema = z.object({
    sessionId: z.string().optional(),
    query: z.string(),
    contract_type: z.string().optional()
})

export const ChatSessionSchemaAIS = z.object({
    sessionId: z.string().optional(),
    query: z.string(),
    user: z.string(),
    contract_type: z.string().optional()
})

export const ChatFeedbackSession = z.object({
    chatOrder: z.number(),
    feedback: z.boolean(),
    sessionId: z.string(),
    user: z.string()

})

export const ChatHistorySession = z.object({
    sessionId: z.string(),
    user: z.string(),
    contract_type: z.string().optional()

})
export const ChatSearchSessionSchema = z.object({
    document_name: z.string(),
    type_search: z.string(),
    search: z.string(),
    contract_type: z.string()
})

