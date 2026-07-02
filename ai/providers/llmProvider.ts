import { ChatOpenAI } from "@langchain/openai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatMistralAI } from "@langchain/mistralai"
import { BaseMessage, HumanMessage } from "@langchain/core/messages"
import type { AnalyzeAttachment } from "@/ai/attachments"

export type LLMProvider = "openai" | "google" | "mistral" | "openai_compatible"

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  model: string
  baseUrl?: string
}

export interface LLMSettings {
  providers: LLMConfig[]
}

export interface LLMRequest {
  prompt: string
  schema?: Record<string, unknown>
  attachments?: AnalyzeAttachment[]
}

export interface LLMResponse {
  output: Record<string, string>
  tokensUsed?: number
  provider: LLMProvider
  error?: string
}

type LLMModel = ChatOpenAI | ChatGoogleGenerativeAI | ChatMistralAI

type MessageContent = Array<{ type: string; text?: string; image_url?: { url: string } }>

function extractErrorInfo(error: unknown): {
  message: string | undefined
  cause: unknown
  status: number | undefined
  errorBody: unknown
} {
  const obj = error as Record<string, unknown>
  return {
    message: typeof obj?.message === "string" ? obj.message : undefined,
    cause: obj?.cause,
    status: obj?.status as number | undefined,
    errorBody: obj?.error,
  }
}

async function requestLLMUnified(config: LLMConfig, req: LLMRequest): Promise<LLMResponse> {
  try {
    const temperature = 0
    let model: LLMModel
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
    } else if (config.provider === "openai_compatible") {
      model = new ChatOpenAI({
        apiKey: config.apiKey || "not-needed",
        model: config.model,
        temperature: temperature,
        configuration: {
          baseURL: config.baseUrl?.trim(),
        },
      })
    } else {
      return {
        output: {},
        provider: config.provider,
        error: "Unknown provider",
      }
    }

    const messageContent: MessageContent = [{ type: "text", text: req.prompt }]
    if (req.attachments && req.attachments.length > 0) {
      const images = req.attachments.map((att) => ({
        type: "image_url",
        image_url: {
          url: `data:${att.contentType};base64,${att.base64}`,
        },
      }))
      messageContent.push(...images)
    }
    const messages: BaseMessage[] = [new HumanMessage({ content: messageContent })]

    let response: Record<string, unknown>
    if (config.provider === "openai_compatible") {
      const raw = await model.invoke(messages)
      const rawContent = raw as { content: string | Array<{ text?: string }> }
      const text = typeof rawContent.content === "string"
        ? rawContent.content
        : Array.isArray(rawContent.content)
          ? rawContent.content.map((c: { text?: string }) => c.text || "").join("")
          : ""
      response = JSON.parse(text.replace(/```(?:json)?\s*/g, "").trim())
    } else {
      const structuredModel = model.withStructuredOutput(req.schema!, { name: "transaction" })
      response = await structuredModel.invoke(messages) as Record<string, unknown>
    }

    return {
      output: response as Record<string, string>,
      provider: config.provider,
    }
  } catch (error: unknown) {
    const info = extractErrorInfo(error)
    const causeMsg = info.cause instanceof Error ? info.cause.message : info.cause ? String(info.cause) : null
    const status = info.status ? ` (HTTP ${info.status})` : ""
    const body = info.errorBody ? ` ${JSON.stringify(info.errorBody)}` : ""
    const detail = [
      info.message ?? `${config.provider} request failed`,
      causeMsg && causeMsg !== info.message ? `cause: ${causeMsg}` : null,
    ].filter(Boolean).join(" | ")

    console.error(`[${config.provider}] LLM request failed${status}:`, {
      message: info.message,
      status: info.status,
      cause: info.cause ?? undefined,
      ...(info.errorBody ? { body: info.errorBody } : {}),
    })

    const isVisionError =
      detail.includes("content.type") ||
      (detail.includes("image_url") && detail.includes("not supported"))

    const visionHint = isVisionError
      ? " — This model does not support image input. Use a vision-capable model or test the provider in Settings."
      : ""

    return {
      output: {},
      provider: config.provider,
      error: `${detail}${status}${body}${visionHint}`,
    }
  }
}

export interface LLMTestResult {
  success: boolean
  supportsVision: boolean
  message: string
}

const TINY_TEST_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

export async function testLLMProvider(config: LLMConfig): Promise<LLMTestResult> {
  try {
    const temperature = 0
    let model: LLMModel
    if (config.provider === "openai") {
      model = new ChatOpenAI({ apiKey: config.apiKey, model: config.model, temperature })
    } else if (config.provider === "google") {
      model = new ChatGoogleGenerativeAI({ apiKey: config.apiKey, model: config.model, temperature })
    } else if (config.provider === "mistral") {
      model = new ChatMistralAI({ apiKey: config.apiKey, model: config.model, temperature })
    } else if (config.provider === "openai_compatible") {
      model = new ChatOpenAI({
        apiKey: config.apiKey || "not-needed",
        model: config.model,
        temperature,
        configuration: { baseURL: config.baseUrl?.trim() },
      })
    } else {
      return { success: false, supportsVision: false, message: `Unknown provider: ${config.provider}` }
    }

    const messages: BaseMessage[] = [
      new HumanMessage({
        content: [
          { type: "text", text: "Reply with the single word: ok" },
          { type: "image_url", image_url: { url: `data:image/png;base64,${TINY_TEST_IMAGE_BASE64}` } },
        ],
      }),
    ]

    const raw = await model.invoke(messages)
    const rawContent = raw as { content: string | Array<{ text?: string }> }
    const text =
      typeof rawContent.content === "string"
        ? rawContent.content
        : Array.isArray(rawContent.content)
          ? rawContent.content.map((c: { text?: string }) => c.text || "").join("")
          : ""

    return {
      success: true,
      supportsVision: true,
      message: `Model responded: "${text.trim().slice(0, 100)}"`,
    }
  } catch (error: unknown) {
    const causeMsg =
      error instanceof Error && error.cause instanceof Error
        ? error.cause.message
        : (error as Record<string, unknown>)?.cause
          ? String((error as Record<string, unknown>).cause)
          : null
    const errorMsg = error instanceof Error ? error.message : String(error)
    const combined = [errorMsg, causeMsg].filter(Boolean).join(" | ")

    const isVisionRejection =
      combined.includes("content.type") ||
      combined.includes("image_url") ||
      (combined.includes("image") && combined.includes("not supported"))

    if (isVisionRejection) {
      return {
        success: false,
        supportsVision: false,
        message: "This model does not support image input. Invoice analysis requires a vision-capable model.",
      }
    }

    return {
      success: false,
      supportsVision: false,
      message: `Connection failed: ${combined}`,
    }
  }
}

export async function requestLLM(settings: LLMSettings, req: LLMRequest): Promise<LLMResponse> {
  for (const config of settings.providers) {
    if (!config.model) {
      console.info("Skipping provider:", config.provider, "(no model)")
      continue
    }
    if (config.provider === "openai_compatible" ? !config.baseUrl : !config.apiKey) {
      console.info("Skipping provider:", config.provider, "(not configured)")
      continue
    }
    console.info("Use provider:", config.provider)

    const response = await requestLLMUnified(config, req)

    if (!response.error) {
      return response
    } else {
      console.error(response.error)
    }
  }

  return {
    output: {},
    provider: settings.providers[0]?.provider || "openai",
    error: "All LLM providers failed or are not configured",
  }
}
