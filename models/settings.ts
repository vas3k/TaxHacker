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
  "atlascloud_api_key",
  "atlascloud_model_name",
  "atlascloud_base_url",
  "openai_compatible_api_key",
  "openai_compatible_model_name",
  "openai_compatible_base_url",
  "llm_providers",
] as const

function isSelfHostedOnlySetting(code: string): code is (typeof SELF_HOSTED_ONLY_SETTINGS)[number] {
  return SELF_HOSTED_ONLY_SETTINGS.includes(code as (typeof SELF_HOSTED_ONLY_SETTINGS)[number])
}

/**
 * Helper to extract LLM provider settings from SettingsMap.
 * Self-hosted uses per-user DB settings and provider order.
 * Otherwise OpenAI is hard-coded via OPENAI_API_KEY / OPENAI_MODEL_NAME.
 */
export function getLLMSettings(settings: SettingsMap) {
  if (config.selfHosted.isEnabled) {
    const priorities = (settings.llm_providers || "openai,google,mistral,atlascloud,openai_compatible")
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
          }
        }
        if (provider === "google") {
          return {
            provider: provider as LLMProvider,
            apiKey: settings.google_api_key || "",
            model: settings.google_model_name || PROVIDERS[1].defaultModelName,
          }
        }
        if (provider === "mistral") {
          return {
            provider: provider as LLMProvider,
            apiKey: settings.mistral_api_key || "",
            model: settings.mistral_model_name || PROVIDERS[2].defaultModelName,
          }
        }
        if (provider === "openai_compatible") {
          const providerMeta = PROVIDERS.find((p) => p.key === "openai_compatible")
          return {
            provider: provider as LLMProvider,
            apiKey: settings.openai_compatible_api_key || "",
            model: settings.openai_compatible_model_name || "",
            baseUrl: settings.openai_compatible_base_url || providerMeta?.defaultBaseUrl || "",
          }
        }
        if (provider === "atlascloud") {
          const providerMeta = PROVIDERS.find((p) => p.key === "atlascloud")
          return {
            provider: provider as LLMProvider,
            apiKey: settings.atlascloud_api_key || "",
            model: settings.atlascloud_model_name || providerMeta?.defaultModelName || "",
            baseUrl: settings.atlascloud_base_url || providerMeta?.defaultBaseUrl || "",
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
      },
    ],
  }
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
