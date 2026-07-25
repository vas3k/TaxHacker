import { describe, expect, it } from "vitest"
import { PROVIDERS } from "./llm-providers"

describe("LLM provider presets", () => {
  it("registers Atlas Cloud as an OpenAI-compatible provider preset", () => {
    const atlas = PROVIDERS.find((provider) => provider.key === "atlascloud")

    expect(atlas).toMatchObject({
      label: "Atlas Cloud",
      apiKeyName: "atlascloud_api_key",
      modelName: "atlascloud_model_name",
      defaultModelName: "qwen/qwen3.5-27b",
      baseUrlName: "atlascloud_base_url",
      defaultBaseUrl: "https://api.atlascloud.ai/v1",
    })
  })

  it("keeps provider keys unique", () => {
    const keys = PROVIDERS.map((provider) => provider.key)

    expect(new Set(keys).size).toBe(keys.length)
  })
})
