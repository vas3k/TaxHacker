"use server"

import { ActionState } from "@/lib/actions"
import { updateFile } from "@/models/files"
import { getLLMSettings, getSettings } from "@/models/settings"
import { AnalyzeAttachment } from "./attachments"
import { enrichAnalysisOutput } from "./enrichment"
import { requestLLM } from "./providers/llmProvider"

export type AnalysisResult = {
  output: Record<string, string>
  tokensUsed: number
  confidence: number
  warnings: string[]
  usedPythonEnricher: boolean
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

    const result = response.output as Record<string, unknown>
    const tokensUsed = response.tokensUsed || 0
    const enriched = await enrichAnalysisOutput(result)

    console.log("LLM response:", enriched.output)
    console.log("LLM tokens used:", tokensUsed)

    await updateFile(fileId, userId, { cachedParseResult: enriched.output })

    return {
      success: true,
      data: {
        output: enriched.output as Record<string, string>,
        tokensUsed: tokensUsed,
        confidence: enriched.confidence,
        warnings: enriched.warnings,
        usedPythonEnricher: enriched.usedPythonEnricher,
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
