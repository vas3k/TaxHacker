import { lookup } from "node:dns/promises"
import { isIPv4, isIPv6 } from "node:net"
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
  maxConcurrency?: number
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
  const causeObj = obj?.cause as Record<string, unknown> | undefined
  return {
    message: typeof obj?.message === "string" ? obj.message : undefined,
    cause: obj?.cause,
    status: (obj?.status as number | undefined) ?? (causeObj?.status as number | undefined),
    errorBody: obj?.error,
  }
}


const BLOCKED_V4_RANGES: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
]

function ipv4ToInt(address: string): number {
  return address.split(".").reduce((acc, octet) => (acc * 256) + Number(octet), 0) >>> 0
}

/** Loopback, link-local, private, CGNAT, documentation and multicast space. */
export function isPrivateAddress(address: string): boolean {
  if (isIPv4(address)) {
    const value = ipv4ToInt(address)
    return BLOCKED_V4_RANGES.some(([base, bits]) => {
      const size = 2 ** (32 - bits)
      return value >= ipv4ToInt(base) && value < ipv4ToInt(base) + size
    })
  }
  if (isIPv6(address)) {
    const lower = address.toLowerCase()
    if (lower === "::" || lower === "::1") return true
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateAddress(mapped[1])
    return lower.startsWith("fc") || lower.startsWith("fd") || /^fe[89ab]/.test(lower) || lower.startsWith("ff")
  }
  return true
}

/** A URL a server-side request may be sent to: http(s) only, and every address
 *  the hostname resolves to is public. Resolved immediately before the request
 *  so a baseURL naming an internal service, or a name whose DNS answer points
 *  at one, is refused instead of fetched. */
export async function assertPublicHttpUrl(value: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    throw new Error(`not a valid URL: ${value}`)
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`only http and https destinations are allowed, not ${url.protocol}`)
  }
  const host = url.hostname.replace(/^\[|\]$/g, "")
  if (host === "") throw new Error("the destination names no host")
  if (isIPv4(host) || isIPv6(host)) {
    if (isPrivateAddress(host)) throw new Error(`destination ${host} is a loopback, link-local or private address`)
    return url
  }
  const addresses = await lookup(host, { all: true, verbatim: true })
  if (addresses.length === 0) throw new Error(`destination ${host} did not resolve`)
  for (const entry of addresses) {
    if (isPrivateAddress(entry.address)) {
      throw new Error(`destination ${host} resolves to ${entry.address}, a loopback, link-local or private address`)
    }
  }
  return url
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
      if (config.baseUrl?.trim()) await assertPublicHttpUrl(config.baseUrl)
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
      const cleaned = text.replace(/```(?:json)?\s*/g, "").trim()
      // Some openai-compatible models emit raw control chars (e.g. a literal
      // newline) inside JSON string values, which JSON.parse rejects. Replace
      // them with spaces so the value parses (structural whitespace is unaffected).
      response = JSON.parse(cleaned.replace(/[\u0000-\u001F]/g, " "))
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

    const concurrencyHint =
      info.status === 429 && (config.maxConcurrency ?? 1) > 1
        ? " — rate-limited; lower \u201cMax concurrency\u201d for this provider in LLM settings and retry"
        : ""

    return {
      output: {},
      provider: config.provider,
      error: `${detail}${status}${body}${concurrencyHint}${visionHint}`,
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
      if (config.baseUrl?.trim()) await assertPublicHttpUrl(config.baseUrl)
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
  let lastError = "All LLM providers failed or are not configured"
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
    }
    lastError = response.error
    console.error(response.error)
  }

  return {
    output: {},
    provider: settings.providers[0]?.provider || "openai",
    error: lastError,
  }
}
