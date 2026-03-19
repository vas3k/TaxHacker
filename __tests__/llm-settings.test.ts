import { describe, it, expect, vi } from "vitest"

// Mock prisma before importing settings
vi.mock("@/lib/db", () => ({
  prisma: {
    setting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

import { getLLMSettings } from "@/models/settings"

describe("getLLMSettings", () => {
  it("should include minimax in default provider list", () => {
    const settings = getLLMSettings({})
    const providers = settings.providers.map((p) => p.provider)
    expect(providers).toContain("minimax")
  })

  it("should return minimax config from settings map", () => {
    const settings = getLLMSettings({
      minimax_api_key: "sk-test-key",
      minimax_model_name: "MiniMax-M2.7",
      llm_providers: "minimax",
    })
    expect(settings.providers).toHaveLength(1)
    expect(settings.providers[0].provider).toBe("minimax")
    expect(settings.providers[0].apiKey).toBe("sk-test-key")
    expect(settings.providers[0].model).toBe("MiniMax-M2.7")
  })

  it("should respect provider priority order", () => {
    const settings = getLLMSettings({
      llm_providers: "minimax,openai",
      minimax_api_key: "mm-key",
      openai_api_key: "oa-key",
    })
    expect(settings.providers[0].provider).toBe("minimax")
    expect(settings.providers[1].provider).toBe("openai")
  })

  it("should use default model name when not specified", () => {
    const settings = getLLMSettings({
      llm_providers: "minimax",
    })
    expect(settings.providers[0].model).toBe("MiniMax-M2.7")
  })

  it("should handle empty api key gracefully", () => {
    const settings = getLLMSettings({
      llm_providers: "minimax",
      minimax_api_key: "",
    })
    expect(settings.providers[0].apiKey).toBe("")
  })

  it("should filter out unknown providers", () => {
    const settings = getLLMSettings({
      llm_providers: "minimax,unknown_provider,openai",
    })
    const providers = settings.providers.map((p) => p.provider)
    expect(providers).not.toContain("unknown_provider")
    expect(providers).toContain("minimax")
    expect(providers).toContain("openai")
  })

  it("should handle all four providers", () => {
    const settings = getLLMSettings({
      llm_providers: "openai,google,mistral,minimax",
      openai_api_key: "oa",
      google_api_key: "gg",
      mistral_api_key: "ms",
      minimax_api_key: "mm",
    })
    expect(settings.providers).toHaveLength(4)
  })
})
