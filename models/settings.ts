import { prisma } from "@/lib/db"
import { PROVIDERS } from "@/lib/llm-providers"
import { cache } from "react"
import { LLMProvider } from "@/ai/providers/llmProvider"

export type SettingsMap = Record<string, string>

/**
 * Helper to extract LLM provider settings from SettingsMap.
 */
export function getLLMSettings(settings: SettingsMap) {
  const priorities = (settings.llm_providers || "openai,google,mistral,openrouter").split(",").map(p => p.trim()).filter(Boolean)

  const providers = priorities.map((provider) => {
    const providerConfig = PROVIDERS.find(p => p.key === provider)

    if (provider === "openai") {
      return {
        provider: provider as LLMProvider,
        apiKey: settings.openai_api_key || "",
        model: settings.openai_model_name || providerConfig?.defaultModelName || "gpt-4o-mini",
      }
    }
    if (provider === "google") {
      return {
        provider: provider as LLMProvider,
        apiKey: settings.google_api_key || "",
        model: settings.google_model_name || providerConfig?.defaultModelName || "gemini-2.5-flash",
      }
    }
    if (provider === "mistral") {
      return {
        provider: provider as LLMProvider,
        apiKey: settings.mistral_api_key || "",
        model: settings.mistral_model_name || providerConfig?.defaultModelName || "mistral-medium-latest",
      }
    }
    if (provider === "openrouter") {
      return {
        provider: provider as LLMProvider,
        apiKey: settings.openrouter_api_key || "",
        model: settings.openrouter_model_name || providerConfig?.defaultModelName || "openai/gpt-4.1-mini",
      }
    }
    return null
  }).filter((provider): provider is NonNullable<typeof provider> => provider !== null)

  return {
    providers,
  }
}

export const getSettings = cache(async (userId: string): Promise<SettingsMap> => {
  const settings = await prisma.setting.findMany({
    where: { userId },
  })

  return settings.reduce((acc, setting) => {
    acc[setting.code] = setting.value || ""
    return acc
  }, {} as SettingsMap)
})

export const updateSettings = cache(async (userId: string, code: string, value: string | undefined) => {
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
