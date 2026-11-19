import { describe, expect, it } from "vitest"
import {
  createDefaultInstance,
  getDefaultInstances,
  hasConfiguredProvider,
  migrateFromLegacy,
  parseInstances,
  PROVIDER_KINDS,
  ProviderInstance,
  resolveInstances,
  serializeInstances,
} from "./llm-providers"

describe("createDefaultInstance", () => {
  it("creates an openai instance with default model and empty key", () => {
    const inst = createDefaultInstance("openai")
    expect(inst.kind).toBe("openai")
    expect(inst.apiKey).toBe("")
    expect(inst.model).toBe("gpt-4o-mini")
    expect(inst.maxConcurrency).toBe(1)
    expect(inst.baseUrl).toBe("")
    expect(inst.id).toHaveLength(8)
  })

  it("sets default base URL only for openai_compatible", () => {
    const compat = createDefaultInstance("openai_compatible")
    expect(compat.baseUrl).toBe("http://localhost:11434/v1")
    expect(compat.model).toBe("")

    const openai = createDefaultInstance("openai")
    expect(openai.baseUrl).toBe("")
  })

  it("generates unique IDs", () => {
    const ids = new Set<string>()
    for (let i = 0; i < 50; i++) {
      ids.add(createDefaultInstance("openai").id)
    }
    expect(ids.size).toBe(50)
  })
})

describe("serializeInstances / parseInstances round-trip", () => {
  it("round-trips multiple instances of the same kind", () => {
    const instances = [
      createDefaultInstance("openai"),
      createDefaultInstance("openai"),
      createDefaultInstance("google"),
    ]
    const parsed = parseInstances(serializeInstances(instances))
    expect(parsed).toHaveLength(3)
    expect(parsed.map((i) => i.kind)).toEqual(["openai", "openai", "google"])
  })

  it("preserves order across all kinds", () => {
    const instances = [
      createDefaultInstance("mistral"),
      createDefaultInstance("openai"),
      createDefaultInstance("google"),
      createDefaultInstance("openai_compatible"),
    ]
    const parsed = parseInstances(serializeInstances(instances))
    expect(parsed.map((i) => i.kind)).toEqual([
      "mistral",
      "openai",
      "google",
      "openai_compatible",
    ])
  })

  it("preserves all field values", () => {
    const inst: ProviderInstance = {
      id: "abc12345",
      kind: "openai_compatible",
      apiKey: "key-xyz",
      model: "llama3",
      baseUrl: "http://my-host:8080/v1",
      maxConcurrency: 5,
    }
    const parsed = parseInstances(serializeInstances([inst]))
    expect(parsed[0]).toEqual(inst)
  })
})

describe("parseInstances edge cases", () => {
  it("returns empty array for falsy or non-array input", () => {
    expect(parseInstances(undefined)).toEqual([])
    expect(parseInstances("")).toEqual([])
    expect(parseInstances("not json")).toEqual([])
    expect(parseInstances("{}")).toEqual([])
    expect(parseInstances("null")).toEqual([])
    expect(parseInstances("42")).toEqual([])
  })

  it("filters entries with invalid kind", () => {
    const raw = JSON.stringify([
      { id: "a", kind: "openai", apiKey: "k", model: "m", maxConcurrency: 1 },
      { id: "b", kind: "anthropic" },
      { id: "c", kind: 42 },
    ])
    expect(parseInstances(raw)).toHaveLength(1)
    expect(parseInstances(raw)[0].kind).toBe("openai")
  })

  it("generates an id when missing", () => {
    const raw = JSON.stringify([{ kind: "google", model: "gemini-2.5-flash" }])
    const parsed = parseInstances(raw)
    expect(parsed[0].id).toHaveLength(8)
  })

  it("clamps invalid maxConcurrency to 1", () => {
    const raw = JSON.stringify([
      { kind: "openai", maxConcurrency: -5 },
      { kind: "google", maxConcurrency: "abc" },
      { kind: "mistral", maxConcurrency: 0 },
    ])
    const parsed = parseInstances(raw)
    expect(parsed.every((i) => i.maxConcurrency === 1)).toBe(true)
  })

  it("coerces string maxConcurrency to number", () => {
    const raw = JSON.stringify([{ kind: "openai", maxConcurrency: "7" }])
    expect(parseInstances(raw)[0].maxConcurrency).toBe(7)
  })

  it("defaults missing string fields to empty string", () => {
    const raw = JSON.stringify([{ kind: "openai", id: "x" }])
    const parsed = parseInstances(raw)
    expect(parsed[0].apiKey).toBe("")
    expect(parsed[0].model).toBe("")
    expect(parsed[0].baseUrl).toBe("")
  })
})

describe("migrateFromLegacy", () => {
  it("materializes instances in llm_providers order", () => {
    const settings = {
      llm_providers: "google,openai",
      openai_api_key: "sk-123",
      openai_model_name: "gpt-4o",
      openai_max_concurrency: "3",
      google_api_key: "g-key",
      google_model_name: "gemini-2.5-flash",
    }
    const instances = migrateFromLegacy(settings)
    expect(instances[0].kind).toBe("google")
    expect(instances[0].apiKey).toBe("g-key")
    expect(instances[1].kind).toBe("openai")
    expect(instances[1].apiKey).toBe("sk-123")
    expect(instances[1].model).toBe("gpt-4o")
    expect(instances[1].maxConcurrency).toBe(3)
  })

  it("appends missing kinds in default order after requested ones", () => {
    const instances = migrateFromLegacy({ llm_providers: "openai" })
    expect(instances.map((i) => i.kind)).toEqual(PROVIDER_KINDS)
  })

  it("produces all 4 defaults for a brand-new user", () => {
    const instances = migrateFromLegacy({})
    expect(instances).toHaveLength(4)
    expect(instances.map((i) => i.kind)).toEqual(PROVIDER_KINDS)
    expect(instances.every((i) => i.apiKey === "")).toBe(true)
    expect(instances.every((i) => i.maxConcurrency === 1)).toBe(true)
  })

  it("dedupes duplicate kinds in legacy llm_providers", () => {
    const instances = migrateFromLegacy({ llm_providers: "openai,openai,google,openai" })
    const openaiCount = instances.filter((i) => i.kind === "openai").length
    expect(openaiCount).toBe(1)
  })

  it("uses default model when legacy model name is empty", () => {
    const instances = migrateFromLegacy({ openai_api_key: "sk-1" })
    const openai = instances.find((i) => i.kind === "openai")!
    expect(openai.model).toBe("gpt-4o-mini")
  })

  it("preserves openai_compatible base URL from legacy", () => {
    const settings = {
      openai_compatible_base_url: "http://srv:11434/v1",
      openai_compatible_model_name: "llama3",
    }
    const compat = migrateFromLegacy(settings).find((i) => i.kind === "openai_compatible")!
    expect(compat.baseUrl).toBe("http://srv:11434/v1")
    expect(compat.model).toBe("llama3")
  })

  it("uses default base URL when legacy is empty", () => {
    const compat = migrateFromLegacy({}).find((i) => i.kind === "openai_compatible")!
    expect(compat.baseUrl).toBe("http://localhost:11434/v1")
  })
})

describe("resolveInstances", () => {
  it("uses the blob when present and non-empty", () => {
    const blob = serializeInstances([
      { ...createDefaultInstance("mistral"), apiKey: "m-key" },
    ])
    const instances = resolveInstances({
      llm_provider_instances: blob,
      openai_api_key: "legacy-key",
    })
    expect(instances).toHaveLength(1)
    expect(instances[0].kind).toBe("mistral")
    expect(instances[0].apiKey).toBe("m-key")
  })

  it("falls back to legacy when blob is absent", () => {
    const instances = resolveInstances({ openai_api_key: "sk-legacy" })
    const openai = instances.find((i) => i.kind === "openai")!
    expect(openai.apiKey).toBe("sk-legacy")
  })

  it("returns empty array when blob is empty (user removed all cards)", () => {
    expect(resolveInstances({ llm_provider_instances: "[]" })).toEqual([])
  })

  it("returns empty array when blob is corrupt", () => {
    expect(resolveInstances({ llm_provider_instances: "not-json{" })).toEqual([])
  })

  it("returns 4 defaults for a brand-new user with empty settings", () => {
    const instances = resolveInstances({})
    expect(instances).toHaveLength(4)
    expect(instances.map((i) => i.kind)).toEqual(PROVIDER_KINDS)
    expect(instances.every((i) => i.apiKey === "")).toBe(true)
  })
})

describe("hasConfiguredProvider", () => {
  it("returns false for empty settings (new user)", () => {
    expect(hasConfiguredProvider({})).toBe(false)
  })

  it("returns true when an api key is set via legacy codes", () => {
    expect(hasConfiguredProvider({ openai_api_key: "sk-123" })).toBe(true)
  })

  it("returns true when openai_compatible has a base URL and model", () => {
    expect(
      hasConfiguredProvider({
        openai_compatible_base_url: "http://localhost:11434/v1",
        openai_compatible_model_name: "llama3",
      })
    ).toBe(true)
  })

  it("returns false when openai_compatible has only a base URL but no model", () => {
    expect(
      hasConfiguredProvider({ openai_compatible_base_url: "http://localhost:11434/v1" })
    ).toBe(false)
  })

  it("returns false when only an api key field exists but is empty", () => {
    expect(hasConfiguredProvider({ openai_api_key: "" })).toBe(false)
  })

  it("returns true when blob has a configured instance", () => {
    const blob = serializeInstances([{ ...createDefaultInstance("mistral"), apiKey: "x" }])
    expect(hasConfiguredProvider({ llm_provider_instances: blob })).toBe(true)
  })

  it("returns false when blob has instances but none have credentials", () => {
    const blob = serializeInstances(getDefaultInstances())
    expect(hasConfiguredProvider({ llm_provider_instances: blob })).toBe(false)
  })
})
