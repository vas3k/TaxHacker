import { z } from "zod"

const envSchema = z.object({
  BASE_URL: z.string().url().default("http://localhost:7331"),
  PORT: z.string().default("7331"),
  SELF_HOSTED_MODE: z.enum(["true", "false"]).default("true"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL_NAME: z.string().default("gpt-4o-mini"),
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_MODEL_NAME: z.string().default("gemini-2.0-flash"),
  MISTRAL_API_KEY: z.string().optional(),
  MISTRAL_MODEL_NAME: z.string().default("mistral-medium-latest"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, "Auth secret must be at least 16 characters")
    .default("please-set-your-key-here"),
  DISABLE_SIGNUP: z.enum(["true", "false"]).default("false"),
  RESEND_API_KEY: z.string().default("please-set-your-resend-api-key-here"),
  RESEND_FROM_EMAIL: z.string().default("TaxHacker <user@localhost>"),
  RESEND_AUDIENCE_ID: z.string().default(""),
  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
})

const env = envSchema.parse(process.env)

const config = {
  app: {
    title: "TaxHacker",
    description: "Your personal AI accountant",
    version: process.env.npm_package_version || "0.0.1",
    baseURL: env.BASE_URL || `http://localhost:${env.PORT || "7331"}`,
    supportEmail: "me@vas3k.com",
  },
  upload: {
    acceptedMimeTypes: "image/*,.pdf,.doc,.docx,.xls,.xlsx",
    images: {
      maxWidth: 1800,
      maxHeight: 1800,
      quality: 90,
    },
    pdfs: {
      maxPages: 10,
      dpi: 150,
      quality: 90,
      maxWidth: 1500,
      maxHeight: 1500,
    },
  },
  selfHosted: {
    isEnabled: env.SELF_HOSTED_MODE === "true",
    redirectUrl: "/self-hosted/redirect",
    welcomeUrl: "/self-hosted",
  },
  ai: {
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModelName: env.OPENAI_MODEL_NAME,
    googleApiKey: env.GOOGLE_API_KEY,
    googleModelName: env.GOOGLE_MODEL_NAME,
    mistralApiKey: env.MISTRAL_API_KEY,
    mistralModelName: env.MISTRAL_MODEL_NAME,
  },
  auth: {
    secret: env.BETTER_AUTH_SECRET,
    loginUrl: "/enter",
    disableSignup: env.DISABLE_SIGNUP === "true" || env.SELF_HOSTED_MODE === "true",
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    paymentSuccessUrl: `${env.BASE_URL}/cloud/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    paymentCancelUrl: `${env.BASE_URL}/cloud`,
  },
  email: {
    apiKey: env.RESEND_API_KEY,
    from: env.RESEND_FROM_EMAIL,
    audienceId: env.RESEND_AUDIENCE_ID,
  },
} as const

export default config
