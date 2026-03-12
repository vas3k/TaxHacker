"use server"

import { LLMProvider } from "@/ai/providers/llmProvider"

export interface ModelInfo {
  id: string
  name: string
  supportsVision?: boolean
}

export interface ModelListResult {
  models: ModelInfo[]
  error?: string
}

// Cache for model lists (TTL: 1 hour)
const modelCache = new Map<string, { data: ModelInfo[]; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

function getCachedModels(provider: LLMProvider): ModelInfo[] | null {
  const cached = modelCache.get(provider)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  return null
}

function setCachedModels(provider: LLMProvider, models: ModelInfo[]): void {
  modelCache.set(provider, { data: models, timestamp: Date.now() })
}

/**
 * Fetch available models from OpenAI API
 * @see https://platform.openai.com/docs/api-reference/models/list
 */
async function fetchOpenAIModels(apiKey: string): Promise<ModelListResult> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return { models: [], error: `OpenAI API error: ${response.status} - ${error}` }
    }

    const data = await response.json()

    // Filter to only chat models (gpt-*)
    const chatModels = data.data
      .filter((model: any) => model.id.startsWith("gpt-") && !model.id.includes("instruct"))
      .map((model: any) => ({
        id: model.id,
        name: model.id,
        supportsVision: model.id.includes("gpt-4") || model.id.includes("gpt-4o"),
      }))
      .sort((a: ModelInfo, b: ModelInfo) => b.id.localeCompare(a.id)) // Newest first

    return { models: chatModels }
  } catch (error) {
    return {
      models: [],
      error: error instanceof Error ? error.message : "Failed to fetch OpenAI models",
    }
  }
}

/**
 * Fetch available models from Google Gemini API
 * @see https://ai.google.dev/api/models
 */
async function fetchGoogleModels(apiKey: string): Promise<ModelListResult> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`
    )

    if (!response.ok) {
      const error = await response.text()
      return { models: [], error: `Google API error: ${response.status} - ${error}` }
    }

    const data = await response.json()

    // Filter to models that support generateContent
    const generativeModels = data.models
      .filter((model: any) =>
        model.supportedGenerationMethods?.includes("generateContent") &&
        model.name.includes("gemini")
      )
      .map((model: any) => ({
        id: model.name.replace("models/", ""),
        name: model.displayName || model.name.replace("models/", ""),
        supportsVision: model.supportedGenerationMethods?.includes("generateContent"),
      }))
      .sort((a: ModelInfo, b: ModelInfo) => {
        // Sort by version (2.0 > 1.5 > 1.0)
        const versionA = a.id.match(/(\d+\.\d+)/)?.[1] || "0"
        const versionB = b.id.match(/(\d+\.\d+)/)?.[1] || "0"
        return versionB.localeCompare(versionA)
      })

    return { models: generativeModels }
  } catch (error) {
    return {
      models: [],
      error: error instanceof Error ? error.message : "Failed to fetch Google models",
    }
  }
}

/**
 * Fetch available models from Mistral API
 * @see https://docs.mistral.ai/api/endpoint/models
 */
async function fetchMistralModels(apiKey: string): Promise<ModelListResult> {
  try {
    const response = await fetch("https://api.mistral.ai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return { models: [], error: `Mistral API error: ${response.status} - ${error}` }
    }

    const data = await response.json()

    // Filter to chat models
    const chatModels = data.data
      .filter((model: any) =>
        model.capabilities?.completion_chat ||
        model.id.includes("mistral") ||
        model.id.includes("codestral") ||
        model.id.includes("pixtral")
      )
      .map((model: any) => ({
        id: model.id,
        name: model.id,
        supportsVision: model.capabilities?.vision || model.id.includes("pixtral"),
      }))
      .sort((a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id))

    return { models: chatModels }
  } catch (error) {
    return {
      models: [],
      error: error instanceof Error ? error.message : "Failed to fetch Mistral models",
    }
  }
}

/**
 * Fetch available models for a provider
 */
export async function fetchModelsForProvider(
  provider: LLMProvider,
  apiKey: string
): Promise<ModelListResult> {
  if (!apiKey) {
    return { models: [], error: "No API key provided" }
  }

  // Check cache first
  const cached = getCachedModels(provider)
  if (cached) {
    return { models: cached }
  }

  let result: ModelListResult

  switch (provider) {
    case "openai":
      result = await fetchOpenAIModels(apiKey)
      break
    case "google":
      result = await fetchGoogleModels(apiKey)
      break
    case "mistral":
      result = await fetchMistralModels(apiKey)
      break
    default:
      return { models: [], error: `Unknown provider: ${provider}` }
  }

  // Cache successful results
  if (result.models.length > 0) {
    setCachedModels(provider, result.models)
  }

  return result
}

/**
 * Validate if a model exists for a provider
 */
export async function validateModel(
  provider: LLMProvider,
  model: string,
  apiKey: string
): Promise<{ valid: boolean; error?: string; suggestions?: string[] }> {
  const result = await fetchModelsForProvider(provider, apiKey)

  if (result.error) {
    return { valid: false, error: result.error }
  }

  const modelExists = result.models.some((m) => m.id === model || m.id === `models/${model}`)

  if (!modelExists) {
    return {
      valid: false,
      error: `Model "${model}" not found`,
      suggestions: result.models.slice(0, 5).map((m) => m.id),
    }
  }

  return { valid: true }
}
