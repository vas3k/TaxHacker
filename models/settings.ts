import { LLMConfig, LLMProvider } from "@/ai/providers/llmProvider"
import config from "@/lib/config"
import { prisma } from "@/lib/db"
import { PROVIDERS, ProviderInstance, resolveInstances } from "@/lib/llm-providers"
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
  "llm_provider_instances",
] as const

function isSelfHostedOnlySetting(code: string): code is (typeof SELF_HOSTED_ONLY_SETTINGS)[number] {
  return SELF_HOSTED_ONLY_SETTINGS.includes(code as (typeof SELF_HOSTED_ONLY_SETTINGS)[number])
}

function toLLMConfig(instance: ProviderInstance): LLMConfig {
  return {
    provider: instance.kind,
    apiKey: instance.apiKey,
    model: instance.model,
    baseUrl: instance.baseUrl || undefined,
    maxConcurrency: instance.maxConcurrency,
  }
}

/**
 * Build LLMSettings from the settings map. Self-hosted reads the
 * llm_provider_instances blob (array order = fallback order), migrating
 * transparently from legacy single-instance rows on first read. Cloud mode
 * hard-codes a single OpenAI provider from server config.
 */
export function getLLMSettings(settings: SettingsMap) {
  if (config.selfHosted.isEnabled) {
    const instances = resolveInstances(settings)
    return { providers: instances.map(toLLMConfig) }
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
