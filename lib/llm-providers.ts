export type ProviderKind = "openai" | "google" | "mistral" | "openai_compatible"

export const PROVIDER_KINDS: ProviderKind[] = [
  "openai",
  "google",
  "mistral",
  "openai_compatible",
]

export const LLM_PROVIDER_INSTANCES_CODE = "llm_provider_instances"

export interface ProviderMeta {
  key: string
  label: string
  apiKeyName: string
  modelName: string
  defaultModelName: string
  baseUrlName?: string
  defaultBaseUrl?: string
  maxConcurrencyName: string
  apiDoc: string
  apiDocLabel: string
  placeholder: string
  help: { url: string; label: string }
  logo: string
}

export interface ProviderInstance {
  id: string
  kind: ProviderKind
  apiKey: string
  model: string
  baseUrl: string
  maxConcurrency: number
}

export const PROVIDERS: ProviderMeta[] = [
  {
    key: "openai",
    label: "OpenAI",
    apiKeyName: "openai_api_key",
    modelName: "openai_model_name",
    defaultModelName: "gpt-4o-mini",
    maxConcurrencyName: "openai_max_concurrency",
    apiDoc: "https://platform.openai.com/settings/organization/api-keys",
    apiDocLabel: "OpenAI Platform Console",
    placeholder: "sk-...",
    help: {
      url: "https://platform.openai.com/settings/organization/api-keys",
      label: "OpenAI Platform Console",
    },
    logo: "/logo/openai.svg",
  },
  {
    key: "google",
    label: "Google",
    apiKeyName: "google_api_key",
    modelName: "google_model_name",
    defaultModelName: "gemini-2.5-flash",
    maxConcurrencyName: "google_max_concurrency",
    apiDoc: "https://aistudio.google.com/apikey",
    apiDocLabel: "Google AI Studio",
    placeholder: "...",
    help: {
      url: "https://aistudio.google.com/apikey",
      label: "Google AI Studio",
    },
    logo: "/logo/google.svg",
  },
  {
    key: "mistral",
    label: "Mistral",
    apiKeyName: "mistral_api_key",
    modelName: "mistral_model_name",
    defaultModelName: "mistral-medium-latest",
    maxConcurrencyName: "mistral_max_concurrency",
    apiDoc: "https://admin.mistral.ai/organization/api-keys",
    apiDocLabel: "Mistral Admin Console",
    placeholder: "...",
    help: {
      url: "https://admin.mistral.ai/organization/api-keys",
      label: "Mistral Admin Console",
    },
    logo: "/logo/mistral.svg",
  },
  {
    key: "openai_compatible",
    label: "OpenAI-compatible (Ollama, vLLM, z.ai, etc.)",
    apiKeyName: "openai_compatible_api_key",
    modelName: "openai_compatible_model_name",
    defaultModelName: "",
    baseUrlName: "openai_compatible_base_url",
    defaultBaseUrl: "http://localhost:11434/v1",
    maxConcurrencyName: "openai_compatible_max_concurrency",
    apiDoc: "",
    apiDocLabel: "",
    placeholder: "(optional)",
    help: {
      url: "https://github.com/ollama/ollama/blob/main/docs/openai.md",
      label: "Any OpenAI-compatible API endpoint (z.ai, Ollama, vLLM, LM Studio, etc.)",
    },
    logo: "/logo/openai.svg",
  },
]

export function generateInstanceId(): string {
  return crypto.randomUUID().slice(0, 8)
}

function coerceMaxConcurrency(value: unknown): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}

export function getProviderMeta(kind: ProviderKind): ProviderMeta {
  const meta = PROVIDERS.find((p) => p.key === kind)
  if (!meta) throw new Error(`Unknown provider kind: ${kind}`)
  return meta
}

export function createDefaultInstance(kind: ProviderKind): ProviderInstance {
  const meta = getProviderMeta(kind)
  return {
    id: generateInstanceId(),
    kind,
    apiKey: "",
    model: meta.defaultModelName,
    baseUrl: meta.defaultBaseUrl || "",
    maxConcurrency: 1,
  }
}

export function getDefaultInstances(): ProviderInstance[] {
  return PROVIDER_KINDS.map(createDefaultInstance)
}

export function serializeInstances(instances: ProviderInstance[]): string {
  return JSON.stringify(instances)
}

function coerceInstance(entry: unknown): ProviderInstance | null {
  if (typeof entry !== "object" || entry === null) return null
  const e = entry as Record<string, unknown>
  if (!PROVIDER_KINDS.includes(e.kind as ProviderKind)) return null
  return {
    id: typeof e.id === "string" && e.id ? e.id : generateInstanceId(),
    kind: e.kind as ProviderKind,
    apiKey: typeof e.apiKey === "string" ? e.apiKey : "",
    model: typeof e.model === "string" ? e.model : "",
    baseUrl: typeof e.baseUrl === "string" ? e.baseUrl : "",
    maxConcurrency: coerceMaxConcurrency(e.maxConcurrency),
  }
}

export function parseInstances(raw: string | undefined): ProviderInstance[] {
  if (!raw) return []
  let arr: unknown
  try {
    arr = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(arr)) return []
  return arr.map(coerceInstance).filter((i): i is ProviderInstance => i !== null)
}

export function migrateFromLegacy(settings: Record<string, string>): ProviderInstance[] {
  const raw = settings.llm_providers || PROVIDER_KINDS.join(",")
  const requested = raw.split(",").map((s) => s.trim()).filter(Boolean)
  const seen = new Set<string>()
  const ordered: ProviderKind[] = []
  for (const key of requested) {
    if (!PROVIDER_KINDS.includes(key as ProviderKind)) continue
    if (seen.has(key)) continue
    seen.add(key)
    ordered.push(key as ProviderKind)
  }
  for (const kind of PROVIDER_KINDS) {
    if (!seen.has(kind)) ordered.push(kind)
  }
  return ordered.map((kind) => {
    const meta = getProviderMeta(kind)
    return {
      id: generateInstanceId(),
      kind,
      apiKey: settings[meta.apiKeyName] || "",
      model: settings[meta.modelName] || meta.defaultModelName,
      baseUrl: meta.baseUrlName
        ? settings[meta.baseUrlName] || meta.defaultBaseUrl || ""
        : "",
      maxConcurrency: coerceMaxConcurrency(settings[meta.maxConcurrencyName]),
    }
  })
}

export function resolveInstances(settings: Record<string, string>): ProviderInstance[] {
  const blob = settings[LLM_PROVIDER_INSTANCES_CODE]
  if (blob === undefined) return migrateFromLegacy(settings)
  return parseInstances(blob)
}

export function hasConfiguredProvider(settings: Record<string, string>): boolean {
  return resolveInstances(settings).some((i) => {
    if (!i.model) return false
    return i.kind === "openai_compatible" ? Boolean(i.baseUrl) : Boolean(i.apiKey)
  })
}
