"use server"

import { ActionState } from "@/lib/actions"
import OpenAI from "openai"
import { AnalyzeAttachment } from "./attachments"

export type AnalysisResult = {
  output: Record<string, string>
  tokensUsed: number
}

export async function analyzeTransaction(
  prompt: string,
  schema: Record<string, unknown>,
  attachments: AnalyzeAttachment[],
  apiKey: string
): Promise<ActionState<AnalysisResult>> {
  const openai = new OpenAI({
    apiKey,
  })
  console.log("RUNNING AI ANALYSIS")
  console.log("PROMPT:", prompt)
  console.log("SCHEMA:", schema)

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
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
    return { success: true, data: { output: result, tokensUsed: response.usage?.total_tokens || 0 } }
  } catch (error) {
    console.error("AI Analysis error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze invoice",
    }
  }
}
