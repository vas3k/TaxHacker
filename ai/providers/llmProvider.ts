import { ChatOpenAI } from "@langchain/openai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatMistralAI } from "@langchain/mistralai"
import { BaseMessage, HumanMessage } from "@langchain/core/messages"

export type LLMProvider = "openai" | "google" | "mistral" | "ollama"

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  model: string
}

export interface LLMSettings {
  providers: LLMConfig[]
}

export interface LLMRequest {
  prompt: string
  schema?: Record<string, unknown>
  attachments?: any[]
}

export interface LLMResponse {
  output: Record<string, string>
  tokensUsed?: number
  provider: LLMProvider
  error?: string
}

// Known valid model names for each provider (for error messages)
const VALID_MODELS: Record<LLMProvider, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
  google: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash"],
  mistral: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest", "open-mistral-nemo"],
  ollama: ["llava", "llava:13b", "llama3.2-vision", "bakllava", "moondream"],
}

function formatModelError(provider: LLMProvider, model: string, originalError: string): string {
  const validModels = VALID_MODELS[provider]

  // Check for common error patterns and provide helpful messages
  if (
    originalError.includes("does not support images") ||
    originalError.includes("not found") ||
    originalError.includes("model not found") ||
    originalError.includes("Invalid model") ||
    originalError.includes("404")
  ) {
    return `Model "${model}" for ${provider} is invalid or does not exist. Valid models include: ${validModels.join(", ")}. Please check your settings.`
  }

  if (originalError.includes("API key") || originalError.includes("authentication") || originalError.includes("401")) {
    return `Invalid API key for ${provider}. Please verify your API key in settings.`
  }

  if (originalError.includes("rate limit") || originalError.includes("429")) {
    return `Rate limit exceeded for ${provider}. Please try again later.`
  }

  if (originalError.includes("quota") || originalError.includes("insufficient")) {
    return `Quota exceeded for ${provider}. Please check your billing/quota settings.`
  }

  // Return original error with model context
  return `${provider} (model: ${model}) error: ${originalError}`
}

async function requestLLMUnified(config: LLMConfig, req: LLMRequest): Promise<LLMResponse> {
  try {
    const temperature = 0
    let model: any
    if (config.provider === "openai") {
      model = new ChatOpenAI({
        apiKey: config.apiKey,
        model: config.model,
        temperature: temperature,
      })
    } else if (config.provider === "google") {
      model = new ChatGoogleGenerativeAI({
        apiKey: config.apiKey,
        model: config.model,
        temperature: temperature,
      })
    } else if (config.provider === "mistral") {
      model = new ChatMistralAI({
        apiKey: config.apiKey,
        model: config.model,
        temperature: temperature,
      })
    } else if (config.provider === "ollama") {
      // Ollama uses OpenAI-compatible API
      // config.apiKey contains the base URL (e.g., http://localhost:11434)
      const baseUrl = config.apiKey.endsWith("/") ? config.apiKey.slice(0, -1) : config.apiKey
      model = new ChatOpenAI({
        configuration: {
          baseURL: `${baseUrl}/v1`,
        },
        apiKey: "ollama", // Ollama doesn't require a real API key
        model: config.model,
        temperature: temperature,
      })
    } else {
      return {
        output: {},
        provider: config.provider,
        error: "Unknown provider",
      }
    }

    const structuredModel = model.withStructuredOutput(req.schema, { name: "transaction" })

    let message_content: any = [{ type: "text", text: req.prompt }]
    if (req.attachments && req.attachments.length > 0) {
      const images = req.attachments.map((att) => ({
        type: "image_url",
        image_url: {
          url: `data:${att.contentType};base64,${att.base64}`,
        },
      }))
      message_content.push(...images)
    }
    const messages: BaseMessage[] = [new HumanMessage({ content: message_content })]

    const response = await structuredModel.invoke(messages)

    return {
      output: response,
      provider: config.provider,
    }
  } catch (error: any) {
    const originalError = error instanceof Error ? error.message : `${config.provider} request failed`
    const formattedError = formatModelError(config.provider, config.model, originalError)

    return {
      output: {},
      provider: config.provider,
      error: formattedError,
    }
  }
}

export async function requestLLM(settings: LLMSettings, req: LLMRequest): Promise<LLMResponse> {
  const errors: string[] = []

  for (const config of settings.providers) {
    if (!config.apiKey || !config.model) {
      console.info("Skipping provider:", config.provider, "(no API key or model configured)")
      continue
    }
    console.info("Use provider:", config.provider, "with model:", config.model)

    const response = await requestLLMUnified(config, req)

    if (!response.error) {
      return response
    } else {
      console.error(response.error)
      errors.push(response.error)
    }
  }

  // Build a helpful error message
  const configuredProviders = settings.providers.filter(p => p.apiKey && p.model)

  if (configuredProviders.length === 0) {
    return {
      output: {},
      provider: settings.providers[0]?.provider || "openai",
      error: "No LLM providers configured. Please add an API key and model name in Settings > LLM Providers.",
    }
  }

  // Include specific errors for each failed provider
  const errorDetails = errors.length > 0 ? ` Errors: ${errors.join(" | ")}` : ""
  return {
    output: {},
    provider: settings.providers[0]?.provider || "openai",
    error: `All LLM providers failed.${errorDetails}`,
  }
}
