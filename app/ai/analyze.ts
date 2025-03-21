import { Category, Field, File, Project } from "@prisma/client"
import OpenAI from "openai"
import { buildLLMPrompt } from "./prompt"
import { fieldsToJsonSchema } from "./schema"

const MAX_PAGES_TO_ANALYZE = 4

type AnalyzeAttachment = {
  filename: string
  contentType: string
  base64: string
}

export const retrieveAllAttachmentsForAI = async (file: File): Promise<AnalyzeAttachment[]> => {
  const attachments: AnalyzeAttachment[] = []
  for (let i = 1; i < MAX_PAGES_TO_ANALYZE; i++) {
    try {
      const attachment = await retrieveFileContentForAI(file, i)
      attachments.push(attachment)
    } catch (error) {
      break
    }
  }

  return attachments
}

export const retrieveFileContentForAI = async (file: File, page: number): Promise<AnalyzeAttachment> => {
  const response = await fetch(`/files/preview/${file.id}?page=${page}`)
  if (!response.ok) throw new Error("Failed to retrieve file")

  const blob = await response.blob()
  const buffer = await blob.arrayBuffer()
  const base64 = Buffer.from(buffer).toString("base64")

  return {
    filename: file.filename,
    contentType: response.headers.get("Content-Type") || file.mimetype,
    base64: base64,
  }
}

export async function analyzeTransaction(
  promptTemplate: string,
  settings: Record<string, string>,
  fields: Field[],
  categories: Category[] = [],
  projects: Project[] = [],
  attachments: AnalyzeAttachment[] = []
): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
  const openai = new OpenAI({
    apiKey: settings.openai_api_key,
    dangerouslyAllowBrowser: true,
  })

  const prompt = buildLLMPrompt(promptTemplate, fields, categories, projects)
  const schema = fieldsToJsonSchema(fields)

  console.log("PROMPT:", prompt)
  console.log("SCHEMA:", schema)

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini-2024-07-18",
      input: [
        {
          role: "user",
          content: prompt,
        },
        {
          role: "user",
          content: attachments.map((attachment) => ({
            type: "input_image",
            detail: "auto",
            image_url: `data:${attachment.contentType};base64,${attachment.base64}`,
          })),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "transaction",
          schema: schema,
          strict: true,
        },
      },
    })

    console.log("ChatGPT response:", response.output_text)

    const result = JSON.parse(response.output_text)
    return { success: true, data: result }
  } catch (error) {
    console.error("AI Analysis error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze invoice",
    }
  }
}
