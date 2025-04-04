import { z } from "zod"

const envSchema = z.object({
  BASE_URL: z.string().url().default("http://localhost:7331"),
  PORT: z.string().default("7331"),
  SELF_HOSTED_MODE: z.enum(["true", "false"]).default("false"),
  OPENAI_API_KEY: z.string().optional(),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, "Auth secret must be at least 16 characters")
    .default("please-set-your-key-here"),
  DISABLE_SIGNUP: z.enum(["true", "false"]).default("false"),
  RESEND_API_KEY: z.string().default("please-set-your-resend-api-key-here"),
  RESEND_FROM_EMAIL: z.string().default("TaxHacker <user@localhost>"),
  RESEND_AUDIENCE_ID: z.string().default(""),
})

const env = envSchema.parse(process.env)

const config = {
  app: {
    title: "TaxHacker",
    description: "Your personal AI helper for taxes",
    version: process.env.npm_package_version || "0.0.1",
    baseURL: env.BASE_URL || `http://localhost:${env.PORT || "7331"}`,
  },
  upload: {
    acceptedMimeTypes: "image/*,.pdf,.doc,.docx,.xls,.xlsx",
  },
  selfHosted: {
    isEnabled: env.SELF_HOSTED_MODE === "true",
    redirectUrl: "/self-hosted/redirect",
    welcomeUrl: "/self-hosted",
  },
  ai: {
    openaiApiKey: env.OPENAI_API_KEY,
  },
  auth: {
    secret: env.BETTER_AUTH_SECRET,
    loginUrl: "/enter",
    disableSignup: env.DISABLE_SIGNUP === "true" || env.SELF_HOSTED_MODE === "true",
  },
  email: {
    apiKey: env.RESEND_API_KEY,
    from: env.RESEND_FROM_EMAIL,
    audienceId: env.RESEND_AUDIENCE_ID,
  },
} as const

export default config
