import {z} from 'zod'



export const ChatSessionSchema = z.object({
    sessionId: z.string().optional(),
    query: z.string()
})

export const ChatSearchSessionSchema = z.object({
    document_name: z.string(),
    type_search: z.string(),
    search: z.string()
})

