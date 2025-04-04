const config = {
  app: {
    title: "TaxHacker",
    description: "Your personal AI accountant",
    version: process.env.npm_package_version || "0.0.1",
    baseURL: process.env.BASE_URL || "http://localhost:" + process.env.PORT,
  },
  upload: {
    acceptedMimeTypes: "image/*,.pdf,.doc,.docx,.xls,.xlsx",
  },
  selfHosted: {
    isEnabled: process.env.SELF_HOSTED_MODE === "true",
    redirectUrl: "/self-hosted/redirect",
    welcomeUrl: "/self-hosted",
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || "",
  },
  auth: {
    secret: process.env.BETTER_AUTH_SECRET || "please-set-secret",
    loginUrl: "/enter",
    disableSignup: process.env.DISABLE_SIGNUP === "true" || process.env.SELF_HOSTED_MODE === "true",
  },
  email: {
    apiKey: process.env.RESEND_API_KEY || "please-set-api-key",
    from: process.env.RESEND_FROM_EMAIL || "user@localhost",
    audienceId: process.env.RESEND_AUDIENCE_ID || "",
  },
}

export default config
