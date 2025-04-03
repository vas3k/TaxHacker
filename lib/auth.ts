import { AUTH_LOGIN_URL, IS_SELF_HOSTED_MODE, SELF_HOSTED_REDIRECT_URL } from "@/lib/constants"
import { createUserDefaults } from "@/models/defaults"
import { getSelfHostedUser, getUserByEmail } from "@/models/users"
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
  email: {
    provider: "resend",
    from: process.env.RESEND_FROM_EMAIL!,
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
      disableSignUp: true,
      otpLength: 6,
      expiresIn: 10 * 60, // 10 minutes
      sendVerificationOTP: async ({ email, otp }) => {
        const user = await getUserByEmail(email as string)
        if (!user) {
          throw new Error("User with this email does not exist")
        }
        await sendOTPCodeEmail({ email, otp })
      },
    }),
    nextCookies(), // make sure this is the last plugin in the array
  ],
})

export async function getSession() {
  if (IS_SELF_HOSTED_MODE) {
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
    if (IS_SELF_HOSTED_MODE) {
      redirect(SELF_HOSTED_REDIRECT_URL)
    } else {
      redirect(AUTH_LOGIN_URL)
    }
  }
  return session.user as User
}
