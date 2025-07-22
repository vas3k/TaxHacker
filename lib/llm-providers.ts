export const PROVIDERS = [
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
      label: "OpenAI Platform Console"
    },
    logo: "/logo/openai.svg"
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
    apiDoc: "https://admin.mistral.ai/organization/api-keys",
    apiDocLabel: "Mistral Admin Console",
    placeholder: "...",
    help: {
      url: "https://admin.mistral.ai/organization/api-keys",
      label: "Mistral Admin Console"
    },
    logo: "/logo/mistral.svg"
  },
]
