"use server"

import { analyzeTransaction } from "@/ai/analyze"
import { getCurrentUser } from "@/lib/auth"
import config from "@/lib/config"
import { getAppData, setAppData } from "@/models/apps"
import { getSettings } from "@/models/settings"
import { getTransactions } from "@/models/transactions"
import { User } from "@/prisma/client"
import { revalidatePath } from "next/cache"

export type TaxAdviceRequest = {
  prompt: string
  countryCode?: string
}

export type TaxRecommendation = {
  title: string
  description: string
  steps: string[]
}

export type TaxAdviceResponse = {
  recommendations: TaxRecommendation[]
  problematicTransactions: {
    id: string
    name: string
    reason: string
  }[]
}

// Define the type for stored app data
export type TaxAdvisorAppData = {
  lastRequest: {
    prompt: string
    countryCode: string
  }
  lastResponse: TaxAdviceResponse
}

// Define a schema for the LLM response
const taxAdviceSchema = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      description: "List of tax recommendations with structured details",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "A short, specific title for the recommendation",
          },
          description: {
            type: "string",
            description: "A detailed explanation of the tax recommendation",
          },
          steps: {
            type: "array",
            description: "A list of specific steps or actions to take for this recommendation",
            items: {
              type: "string",
            },
          },
        },
        required: ["title", "description", "steps"],
        additionalProperties: false,
      },
    },
    problematicTransactions: {
      type: "array",
      description: "List of transactions that might be problematic for tax purposes",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID of the transaction",
          },
          name: {
            type: "string",
            description: "Name of the transaction",
          },
          reason: {
            type: "string",
            description: "Reason why this transaction is problematic for tax purposes",
          },
        },
        required: ["id", "name", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["recommendations", "problematicTransactions"],
  additionalProperties: false,
}

export async function getLastTaxAdviceData(user: User): Promise<TaxAdvisorAppData | null> {
  const appData = (await getAppData(user, "taxadvisor")) as TaxAdvisorAppData | null
  return appData
}

export async function saveTaxAdviceData(
  user: User,
  request: TaxAdviceRequest,
  response: TaxAdviceResponse
): Promise<{ success: boolean; error?: string }> {
  try {
    const appData: TaxAdvisorAppData = {
      lastRequest: {
        prompt: request.prompt,
        countryCode: request.countryCode || "us",
      },
      lastResponse: response,
    }

    await setAppData(user, "taxadvisor", appData)
    return { success: true }
  } catch (error) {
    console.error("Failed to save tax advice data:", error)
    return {
      success: false,
      error: `Failed to save tax advice data: ${error}`,
    }
  }
}

export async function getTransactionTaxAdvice(
  request: TaxAdviceRequest
): Promise<{ success: boolean; data?: TaxAdviceResponse; error?: string }> {
  try {
    const user = await getCurrentUser()
    const { transactions } = await getTransactions(user.id)
    const settings = await getSettings(user.id)

    const apiKey = settings.openai_api_key || config.ai.openaiApiKey || ""
    if (!apiKey) {
      return {
        success: false,
        error: "OpenAI API key not found in settings. Please set up your API key first.",
      }
    }

    // Prepare transaction data for the LLM
    const transactionData = transactions.map((tx) => ({
      id: tx.id,
      date: tx.issuedAt?.toISOString().slice(0, 10) || "unknown",
      name: tx.name || "Unnamed",
      merchant: tx.merchant || "Unknown",
      description: tx.description || "",
      amount: tx.total ? tx.total / 100 : 0,
      currency: tx.currencyCode || "Unknown",
      type: tx.type || "expense",
      categoryCode: tx.categoryCode || "unknown",
      projectCode: tx.projectCode || "unknown",
    }))

    // Base prompt from request
    let finalPrompt = request.prompt || ""

    // Add transaction context to the prompt
    finalPrompt += "\n\nHere are my transactions:\n" + JSON.stringify(transactionData, null, 2)

    // Instructions for format
    finalPrompt +=
      "\n\nPlease provide your analysis as JSON with structured recommendations (including title, description, and steps) and a list of problematic transactions."

    // Call the LLM API through the analyze function
    const response = await analyzeTransaction(
      finalPrompt,
      taxAdviceSchema,
      [], // No attachments needed
      apiKey
    )

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || "Failed to process request",
      }
    }

    const llmResponse = response.data.output as unknown as TaxAdviceResponse

    // Save the request and response to app data
    await saveTaxAdviceData(user, request, llmResponse)

    revalidatePath("/apps/taxadvisor")

    return {
      success: true,
      data: llmResponse,
    }
  } catch (error) {
    console.error("Failed to get tax advice:", error)
    return {
      success: false,
      error: `Failed to get tax advice: ${error}`,
    }
  }
}
