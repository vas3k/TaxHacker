import { Category, Field, File, Project } from "@prisma/client"
import OpenAI from "openai"
import { ChatCompletion } from "openai/resources/index.mjs"
import { buildLLMPrompt } from "./prompt"

const MAX_PAGES_TO_ANALYZE = 3

type AnalyzeAttachment = {
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

  return { contentType: response.headers.get("Content-Type") || file.mimetype, base64: base64 }
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

  console.log("PROMPT:", prompt)

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt || "" },
            ...attachments.slice(0, MAX_PAGES_TO_ANALYZE).map((attachment) => ({
              type: "image_url" as const,
              image_url: {
                url: `data:${attachment.contentType};base64,${attachment.base64}`,
              },
            })),
          ],
        },
      ],
    })

    console.log("ChatGPT response:", response.choices[0].message)

    const cleanedJson = extractAndParseJSON(response)

    return { success: true, data: cleanedJson }
  } catch (error) {
    console.error("AI Analysis error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze invoice",
    }
  }
}

function extractAndParseJSON(response: ChatCompletion) {
  try {
    const content = response.choices?.[0]?.message?.content

    if (!content) {
      throw new Error("No response content from AI")
    }

    // Check for JSON in code blocks (handles ```json, ``` json, or just ```)
    let jsonText = content.trim()
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/
    const jsonMatch = content.match(codeBlockRegex)

    if (jsonMatch && jsonMatch[1]) {
      jsonText = jsonMatch[1].trim()
    }

    // Try to parse the JSON
    try {
      return JSON.parse(jsonText)
    } catch (parseError) {
      // JSON might have unescaped characters, try to fix them
      const fixedJsonText = escapeJsonString(jsonText)
      return JSON.parse(fixedJsonText)
    }
  } catch (error) {
    console.error("Error processing AI response:", error)
    throw new Error(`Failed to extract valid JSON: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

function escapeJsonString(jsonStr: string) {
  // This is a black magic to fix some AI-generated JSONs
  if (jsonStr.trim().startsWith("{") && jsonStr.trim().endsWith("}")) {
    return jsonStr.replace(/"([^"]*?)":(\s*)"(.*?)"/g, (match, key, space, value) => {
      const escapedValue = value
        .replace(/\\/g, "\\\\") // backslash
        .replace(/"/g, '\\"') // double quotes
        .replace(/\n/g, "\\n") // newline
        .replace(/\r/g, "\\r") // carriage return
        .replace(/\t/g, "\\t") // tab
        .replace(/\f/g, "\\f") // form feed
        .replace(/[\x00-\x1F\x7F-\x9F]/g, (c: string) => {
          return "\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4)
        })

      return `"${key}":${space}"${escapedValue}"`
    })
  }

  return jsonStr
}
