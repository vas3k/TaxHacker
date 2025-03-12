import { z } from "zod"

export const settingsFormSchema = z.object({
  app_title: z.string().max(128).optional(),
  default_currency: z.string().max(5).optional(),
  default_type: z.string().optional(),
  default_category: z.string().optional(),
  default_project: z.string().optional(),
  openai_api_key: z.string().optional(),
  prompt_analyse_new_file: z.string().optional(),
})
