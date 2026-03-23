export const PROVIDERS = [
  {
    key: "openai",
    label: "OpenAI",
    apiKeyName: "openai_api_key",
    modelName: "openai_model_name",
    defaultModelName: "gpt-4o-mini",
    suggestedModels: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    apiDoc: "https://platform.openai.com/settings/organization/api-keys",
    apiDocLabel: "OpenAI Platform Console",
    placeholder: "sk-...",
    help: {
      url: "https://platform.openai.com/settings/organization/api-keys",
      label: "OpenAI Platform Console"
    },
    logo: "/logo/openai.svg"
  },
  {
    key: "google",
    label: "Google",
    apiKeyName: "google_api_key",
    modelName: "google_model_name",
    defaultModelName: "gemini-2.0-flash",
    suggestedModels: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-pro"],
    apiDoc: "https://aistudio.google.com/apikey",
    apiDocLabel: "Google AI Studio",
    placeholder: "...",
    help: {
      url: "https://aistudio.google.com/apikey",
      label: "Google AI Studio"
    },
    logo: "/logo/google.svg"
  },
  {
    key: "mistral",
    label: "Mistral",
    apiKeyName: "mistral_api_key",
    modelName: "mistral_model_name",
    defaultModelName: "mistral-medium-latest",
    suggestedModels: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest"],
    apiDoc: "https://admin.mistral.ai/organization/api-keys",
    apiDocLabel: "Mistral Admin Console",
    placeholder: "...",
    help: {
      url: "https://admin.mistral.ai/organization/api-keys",
      label: "Mistral Admin Console"
    },
    logo: "/logo/mistral.svg"
  },
  {
    key: "ollama",
    label: "Ollama (Local)",
    apiKeyName: "ollama_base_url",
    modelName: "ollama_model_name",
    defaultModelName: "llava",
    suggestedModels: ["llava", "llava:13b", "llama3.2-vision", "bakllava"],
    apiDoc: "https://ollama.ai/download",
    apiDocLabel: "Ollama Download",
    placeholder: "http://localhost:11434",
    help: {
      url: "https://ollama.ai/library",
      label: "Ollama Model Library"
    },
    logo: "/logo/ollama.svg",
    isLocal: true
  },
]
