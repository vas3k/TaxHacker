import { LLMProvider } from "@/ai/providers/llmProvider"
import config from "@/lib/config"
import { prisma } from "@/lib/db"
import { PROVIDERS } from "@/lib/llm-providers"
import { cache } from "react"

export type SettingsMap = Record<string, string>

/** Provider credentials/config — only stored and used in self-hosted mode. */
export const SELF_HOSTED_ONLY_SETTINGS = [
  "openai_api_key",
  "openai_model_name",
  "google_api_key",
  "google_model_name",
  "mistral_api_key",
  "mistral_model_name",
  "openai_compatible_api_key",
  "openai_compatible_model_name",
  "openai_compatible_base_url",
  "openai_max_concurrency",
  "google_max_concurrency",
  "mistral_max_concurrency",
  "openai_compatible_max_concurrency",
  "llm_providers",
] as const

function isSelfHostedOnlySetting(code: string): code is (typeof SELF_HOSTED_ONLY_SETTINGS)[number] {
  return SELF_HOSTED_ONLY_SETTINGS.includes(code as (typeof SELF_HOSTED_ONLY_SETTINGS)[number])
}

function parseConcurrency(raw: string | undefined): number {
  const n = parseInt(raw || "", 10)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}

/**
 * Helper to extract LLM provider settings from SettingsMap.
 * Self-hosted uses per-user DB settings and provider order.
 * Otherwise OpenAI is hard-coded via OPENAI_API_KEY / OPENAI_MODEL_NAME.
 */
export function getLLMSettings(settings: SettingsMap) {
  if (config.selfHosted.isEnabled) {
    const priorities = (settings.llm_providers || "openai,google,mistral,openai_compatible")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)

    const providers = priorities
      .map((provider) => {
        if (provider === "openai") {
          return {
            provider: provider as LLMProvider,
            apiKey: settings.openai_api_key || "",
            model: settings.openai_model_name || PROVIDERS[0].defaultModelName,
            maxConcurrency: parseConcurrency(settings.openai_max_concurrency),
          }
        }
        if (provider === "google") {
          return {
            provider: provider as LLMProvider,
            apiKey: settings.google_api_key || "",
            model: settings.google_model_name || PROVIDERS[1].defaultModelName,
            maxConcurrency: parseConcurrency(settings.google_max_concurrency),
          }
        }
        if (provider === "mistral") {
          return {
            provider: provider as LLMProvider,
            apiKey: settings.mistral_api_key || "",
            model: settings.mistral_model_name || PROVIDERS[2].defaultModelName,
            maxConcurrency: parseConcurrency(settings.mistral_max_concurrency),
          }
        }
        if (provider === "openai_compatible") {
          const providerMeta = PROVIDERS.find((p) => p.key === "openai_compatible")
          return {
            provider: provider as LLMProvider,
            apiKey: settings.openai_compatible_api_key || "",
            model: settings.openai_compatible_model_name || "",
            baseUrl: settings.openai_compatible_base_url || providerMeta?.defaultBaseUrl || "",
            maxConcurrency: parseConcurrency(settings.openai_compatible_max_concurrency),
          }
        }
        return null
      })
      .filter((provider): provider is NonNullable<typeof provider> => provider !== null)

    return { providers }
  }

  return {
    providers: [
      {
        provider: "openai" as LLMProvider,
        apiKey: config.ai.openaiApiKey || "",
        model: config.ai.openaiModelName || PROVIDERS[0].defaultModelName,
        maxConcurrency: 1,
      },
    ],
  }
}

/**
 * Max concurrent "Analyze all" requests — the maxConcurrency of the first
 * provider requestLLM would actually use (first with a model + credentials),
 * mirroring its skip logic. Falls back to 1 (serial).
 */
export function getAnalyzeConcurrency(settings: SettingsMap): number {
  const { providers } = getLLMSettings(settings)
  for (const config of providers) {
    if (!config.model) continue
    const hasCredentials =
      config.provider === "openai_compatible" ? Boolean(config.baseUrl) : Boolean(config.apiKey)
    if (!hasCredentials) continue
    return config.maxConcurrency ?? 1
  }
  return 1
}

export const getSettings = cache(async (userId: string): Promise<SettingsMap> => {
  const settings = await prisma.setting.findMany({
    where: { userId },
  })

  const map = settings.reduce((acc, setting) => {
    if (isSelfHostedOnlySetting(setting.code) && !config.selfHosted.isEnabled) {
      return acc
    }
    acc[setting.code] = setting.value || ""
    return acc
  }, {} as SettingsMap)

  return map
})

export const updateSettings = cache(async (userId: string, code: string, value: string | undefined) => {
  if (isSelfHostedOnlySetting(code) && !config.selfHosted.isEnabled) {
    return null
  }

  return await prisma.setting.upsert({
    where: { userId_code: { code, userId } },
    update: { value },
    create: {
      code,
      value,
      name: code,
      userId,
    },
  })
})
