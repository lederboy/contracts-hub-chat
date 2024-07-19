import {z} from 'zod'



export const ChatSessionSchema = z.object({
    sessionId: z.string().optional(),
    query: z.string()
})