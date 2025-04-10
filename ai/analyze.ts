"use server"

import { ActionState } from "@/lib/actions"
import OpenAI from "openai"
import { AnalyzeAttachment } from "./attachments"

export async function analyzeTransaction(
  prompt: string,
  schema: Record<string, unknown>,
  attachments: AnalyzeAttachment[],
  apiKey: string
): Promise<ActionState<Record<string, string>>> {
  const openai = new OpenAI({
    apiKey,
  })
  console.log("RUNNING AI ANALYSIS")
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
    console.log("ChatGPT tokens used:", response.usage)

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
