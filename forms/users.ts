import { z } from "zod"

export const userFormSchema = z.object({
  name: z.string().max(128).optional(),
  avatar: z.string().optional(),
})
