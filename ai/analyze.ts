"use server"

import { ActionState } from "@/lib/actions"
import { AnalyzeAttachment } from "./attachments"
import { updateFile } from "@/models/files"
import { getSettings, getLLMSettings } from "@/models/settings"
import { requestLLM } from "./providers/llmProvider"

export type AnalysisResult = {
  output: Record<string, string>
  tokensUsed: number
}

export async function analyzeTransaction(
  prompt: string,
  schema: Record<string, unknown>,
  attachments: AnalyzeAttachment[],
  fileId: string,
  userId: string
): Promise<ActionState<AnalysisResult>> {

  const settings = await getSettings(userId)
  const llmSettings = getLLMSettings(settings)

  try {
    const response = await requestLLM(llmSettings, {
      prompt,
      schema,
      attachments,
    })

    if (response.error) {
      throw new Error(response.error)
    }

    const result = response.output
    const tokensUsed = response.tokensUsed || 0

    console.log("LLM response:", result)
    console.log("LLM tokens used:", tokensUsed)

    await updateFile(fileId, userId, { cachedParseResult: result })

    return {
      success: true,
      data: {
        output: result,
        tokensUsed: tokensUsed
      },
    }
  } catch (error) {
    console.error("AI Analysis error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze invoice",
    }
  }
}
