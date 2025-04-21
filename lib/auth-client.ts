import { stripeClient } from "@better-auth/stripe/client"
import { createAuthClient } from "better-auth/client"
import { emailOTPClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),
    stripeClient({
      subscription: true,
    }),
  ],
})
