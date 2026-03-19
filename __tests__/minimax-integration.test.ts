import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock LangChain modules using vi.hoisted to avoid hoisting issues
const { mockWithStructuredOutput, mockInvoke, mockChatOpenAI } = vi.hoisted(() => ({
  mockWithStructuredOutput: vi.fn(),
  mockInvoke: vi.fn(),
  mockChatOpenAI: vi.fn(),
}))

vi.mock("@langchain/openai", () => ({
  ChatOpenAI: mockChatOpenAI,
}))

vi.mock("@langchain/google-genai", () => ({
  ChatGoogleGenerativeAI: vi.fn(),
}))

vi.mock("@langchain/mistralai", () => ({
  ChatMistralAI: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  prisma: {
    setting: { findMany: vi.fn(), upsert: vi.fn() },
  },
}))

import { requestLLM, type LLMSettings } from "@/ai/providers/llmProvider"
import { getLLMSettings } from "@/models/settings"
import { PROVIDERS } from "@/lib/llm-providers"

describe("MiniMax integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWithStructuredOutput.mockReturnValue({ invoke: mockInvoke })
    mockChatOpenAI.mockImplementation(function (this: any) {
      Object.assign(this, { withStructuredOutput: mockWithStructuredOutput })
    })
  })

  it("end-to-end: settings -> provider config -> LLM request", async () => {
    mockInvoke.mockResolvedValue({
      amount: "42.50",
      currency: "USD",
      vendor: "MiniMax Test Store",
    })

    // Step 1: Get LLM settings from settings map (simulating DB settings)
    const settingsMap = {
      llm_providers: "minimax",
      minimax_api_key: "sk-integration-test",
      minimax_model_name: "MiniMax-M2.7",
    }
    const llmSettings = getLLMSettings(settingsMap)

    expect(llmSettings.providers).toHaveLength(1)
    expect(llmSettings.providers[0].provider).toBe("minimax")
    expect(llmSettings.providers[0].apiKey).toBe("sk-integration-test")

    // Step 2: Make LLM request
    const schema = {
      type: "object",
      properties: {
        amount: { type: "string" },
        currency: { type: "string" },
        vendor: { type: "string" },
      },
    }

    const result = await requestLLM(llmSettings, {
      prompt: "Extract transaction data from this receipt",
      schema,
    })

    // Step 3: Verify result
    expect(result.provider).toBe("minimax")
    expect(result.error).toBeUndefined()
    expect(result.output).toEqual({
      amount: "42.50",
      currency: "USD",
      vendor: "MiniMax Test Store",
    })

    // Verify ChatOpenAI was configured with MiniMax base URL
    expect(mockChatOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "sk-integration-test",
        model: "MiniMax-M2.7",
        configuration: { baseURL: "https://api.minimax.io/v1" },
      })
    )
  })

  it("provider definition matches settings schema", () => {
    const minimax = PROVIDERS.find((p) => p.key === "minimax")!

    // The provider's apiKeyName should correspond to a settings key
    const settingsMap = {
      [minimax.apiKeyName]: "test-key",
      [minimax.modelName]: "MiniMax-M2.7",
      llm_providers: "minimax",
    }

    const llmSettings = getLLMSettings(settingsMap)
    expect(llmSettings.providers[0].apiKey).toBe("test-key")
    expect(llmSettings.providers[0].model).toBe("MiniMax-M2.7")
  })

  it("minimax falls back to default model from PROVIDERS", () => {
    const minimax = PROVIDERS.find((p) => p.key === "minimax")!
    const settingsMap = { llm_providers: "minimax" }

    const llmSettings = getLLMSettings(settingsMap)
    expect(llmSettings.providers[0].model).toBe(minimax.defaultModelName)
  })

  it("multi-provider priority with minimax as primary", async () => {
    mockInvoke.mockResolvedValue({ amount: "100" })

    const settingsMap = {
      llm_providers: "minimax,openai,google",
      minimax_api_key: "mm-key",
      openai_api_key: "oa-key",
      google_api_key: "gg-key",
    }

    const llmSettings = getLLMSettings(settingsMap)
    expect(llmSettings.providers[0].provider).toBe("minimax")

    const result = await requestLLM(llmSettings, { prompt: "test", schema: {} })
    expect(result.provider).toBe("minimax")
  })
})
