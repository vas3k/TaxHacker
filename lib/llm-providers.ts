export interface ProviderMeta {
  key: string
  label: string
  apiKeyName: string
  modelName: string
  defaultModelName: string
  baseUrlName?: string
  defaultBaseUrl?: string
  apiDoc: string
  apiDocLabel: string
  placeholder: string
  help: { url: string; label: string }
  logo: string
}

export const PROVIDERS: ProviderMeta[] = [
  {
    key: "openai",
    label: "OpenAI",
    apiKeyName: "openai_api_key",
    modelName: "openai_model_name",
    defaultModelName: "gpt-4o-mini",
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
    label: "Ollama, LM Studio, vLLM, LocalAI",
    apiKeyName: "openai_compatible_api_key",
    modelName: "openai_compatible_model_name",
    defaultModelName: "",
    baseUrlName: "openai_compatible_base_url",
    defaultBaseUrl: "http://localhost:11434/v1",
    apiDoc: "",
    apiDocLabel: "",
    placeholder: "(optional)",
    help: {
      url: "https://github.com/ollama/ollama/blob/main/docs/openai.md",
      label: "Any OpenAI Compatible API endpoints",
    },
    logo: "/logo/openai.svg",
  },
]
