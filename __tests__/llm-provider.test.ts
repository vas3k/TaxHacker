import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock LangChain modules using vi.hoisted to avoid hoisting issues
const { mockChatOpenAI, mockChatGoogleGenerativeAI, mockChatMistralAI } = vi.hoisted(() => ({
  mockChatOpenAI: vi.fn(),
  mockChatGoogleGenerativeAI: vi.fn(),
  mockChatMistralAI: vi.fn(),
}))

vi.mock("@langchain/openai", () => ({
  ChatOpenAI: mockChatOpenAI,
}))

vi.mock("@langchain/google-genai", () => ({
  ChatGoogleGenerativeAI: mockChatGoogleGenerativeAI,
}))

vi.mock("@langchain/mistralai", () => ({
  ChatMistralAI: mockChatMistralAI,
}))

import { requestLLM, type LLMSettings, type LLMRequest } from "@/ai/providers/llmProvider"

function createMockModel(response: Record<string, string>) {
  return {
    withStructuredOutput: vi.fn().mockReturnValue({
      invoke: vi.fn().mockResolvedValue(response),
    }),
  }
}

describe("requestLLM - MiniMax provider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should use ChatOpenAI with MiniMax base URL", async () => {
    const mockModel = createMockModel({ amount: "100" })
    mockChatOpenAI.mockImplementation(function () { return mockModel })

    const settings: LLMSettings = {
      providers: [
        {
          provider: "minimax",
          apiKey: "sk-test-minimax",
          model: "MiniMax-M2.7",
        },
      ],
    }

    const req: LLMRequest = {
      prompt: "Extract data",
      schema: { type: "object", properties: { amount: { type: "string" } } },
    }

    const result = await requestLLM(settings, req)

    expect(mockChatOpenAI).toHaveBeenCalledWith({
      apiKey: "sk-test-minimax",
      model: "MiniMax-M2.7",
      temperature: 0,
      configuration: {
        baseURL: "https://api.minimax.io/v1",
      },
    })
    expect(result.provider).toBe("minimax")
    expect(result.error).toBeUndefined()
    expect(result.output).toEqual({ amount: "100" })
  })

  it("should pass temperature=0", async () => {
    const mockModel = createMockModel({})
    mockChatOpenAI.mockImplementation(function () { return mockModel })

    const settings: LLMSettings = {
      providers: [
        { provider: "minimax", apiKey: "key", model: "MiniMax-M2.7" },
      ],
    }

    await requestLLM(settings, { prompt: "test", schema: {} })

    expect(mockChatOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0 })
    )
  })

  it("should fall back to next provider on error", async () => {
    const failModel = {
      withStructuredOutput: vi.fn().mockReturnValue({
        invoke: vi.fn().mockRejectedValue(new Error("MiniMax error")),
      }),
    }
    const successModel = createMockModel({ amount: "50" })

    let callCount = 0
    mockChatOpenAI.mockImplementation(function () {
      callCount++
      return callCount === 1 ? failModel : successModel
    })

    const settings: LLMSettings = {
      providers: [
        { provider: "minimax", apiKey: "mm-key", model: "MiniMax-M2.7" },
        { provider: "openai", apiKey: "oa-key", model: "gpt-4o-mini" },
      ],
    }

    const result = await requestLLM(settings, { prompt: "test", schema: {} })
    expect(result.provider).toBe("openai")
    expect(result.error).toBeUndefined()
  })

  it("should skip minimax when api key is missing", async () => {
    const mockModel = createMockModel({ amount: "50" })
    mockChatOpenAI.mockImplementation(function () { return mockModel })

    const settings: LLMSettings = {
      providers: [
        { provider: "minimax", apiKey: "", model: "MiniMax-M2.7" },
        { provider: "openai", apiKey: "oa-key", model: "gpt-4o-mini" },
      ],
    }

    const result = await requestLLM(settings, { prompt: "test", schema: {} })
    expect(result.provider).toBe("openai")
  })

  it("should return error when all providers fail", async () => {
    mockChatOpenAI.mockImplementation(function () {
      return {
        withStructuredOutput: vi.fn().mockReturnValue({
          invoke: vi.fn().mockRejectedValue(new Error("fail")),
        }),
      }
    })

    const settings: LLMSettings = {
      providers: [
        { provider: "minimax", apiKey: "key", model: "MiniMax-M2.7" },
      ],
    }

    const result = await requestLLM(settings, { prompt: "test", schema: {} })
    expect(result.error).toBeDefined()
  })

  it("should handle unknown provider gracefully", async () => {
    const settings: LLMSettings = {
      providers: [
        { provider: "unknown" as any, apiKey: "key", model: "model" },
      ],
    }

    const result = await requestLLM(settings, { prompt: "test", schema: {} })
    expect(result.error).toContain("failed")
  })
})
