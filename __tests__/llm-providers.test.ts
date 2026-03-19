import { describe, it, expect } from "vitest"
import { PROVIDERS } from "@/lib/llm-providers"

describe("PROVIDERS", () => {
  it("should include minimax as a provider", () => {
    const minimax = PROVIDERS.find((p) => p.key === "minimax")
    expect(minimax).toBeDefined()
  })

  it("should have correct minimax provider fields", () => {
    const minimax = PROVIDERS.find((p) => p.key === "minimax")!
    expect(minimax.label).toBe("MiniMax")
    expect(minimax.apiKeyName).toBe("minimax_api_key")
    expect(minimax.modelName).toBe("minimax_model_name")
    expect(minimax.defaultModelName).toBe("MiniMax-M2.7")
    expect(minimax.logo).toBe("/logo/minimax.svg")
  })

  it("should have valid help URL for minimax", () => {
    const minimax = PROVIDERS.find((p) => p.key === "minimax")!
    expect(minimax.help.url).toContain("minimax.io")
    expect(minimax.apiDoc).toContain("minimax.io")
  })

  it("should have 4 providers total", () => {
    expect(PROVIDERS).toHaveLength(4)
  })

  it("should have unique keys for all providers", () => {
    const keys = PROVIDERS.map((p) => p.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("should have unique apiKeyName for all providers", () => {
    const names = PROVIDERS.map((p) => p.apiKeyName)
    expect(new Set(names).size).toBe(names.length)
  })

  it("should have all required fields for each provider", () => {
    for (const p of PROVIDERS) {
      expect(p.key).toBeTruthy()
      expect(p.label).toBeTruthy()
      expect(p.apiKeyName).toBeTruthy()
      expect(p.modelName).toBeTruthy()
      expect(p.defaultModelName).toBeTruthy()
      expect(p.logo).toBeTruthy()
      expect(p.help).toBeDefined()
      expect(p.help.url).toBeTruthy()
      expect(p.help.label).toBeTruthy()
    }
  })
})
