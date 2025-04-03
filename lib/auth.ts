import config from "@/lib/config"
import { createUserDefaults } from "@/models/defaults"
import { getSelfHostedUser } from "@/models/users"
import { User } from "@prisma/client"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { emailOTP } from "better-auth/plugins/email-otp"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "./db"
import { resend, sendOTPCodeEmail } from "./email"

export type UserProfile = {
  id: string
  name: string
  email: string
  avatar?: string
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  appName: config.app.title,
  baseURL: config.app.baseURL,
  secret: config.auth.secret,
  email: {
    provider: "resend",
    from: config.email.from,
    resend,
  },
  session: {
    strategy: "jwt",
    maxAge: 180 * 24 * 60 * 60, // 180 days
    updateAge: 24 * 60 * 60, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 24 * 60 * 60, // 24 hours
    },
  },
  advanced: {
    generateId: false,
    cookiePrefix: "taxhacker",
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await createUserDefaults(user.id)
        },
      },
    },
  },
  plugins: [
    emailOTP({
      disableSignUp: config.auth.disableSignup,
      otpLength: 6,
      expiresIn: 10 * 60, // 10 minutes
      sendVerificationOTP: async ({ email, otp }) => {
        await sendOTPCodeEmail({ email, otp })
      },
    }),
    nextCookies(), // make sure this is the last plugin in the array
  ],
})

export async function getSession() {
  if (config.selfHosted.isEnabled) {
    const user = await getSelfHostedUser()
    return user ? { user } : null
  }

  return await auth.api.getSession({
    headers: await headers(),
  })
}

export async function getCurrentUser(): Promise<User> {
  const session = await getSession()
  if (!session || !session.user) {
    if (config.selfHosted.isEnabled) {
      redirect(config.selfHosted.redirectUrl)
    } else {
      redirect(config.auth.loginUrl)
    }
  }
  return session.user as User
}
