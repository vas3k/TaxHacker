import { prisma } from "@/lib/db"
import { Prisma } from "@/prisma/client"
import { cache } from "react"

export const SELF_HOSTED_USER = {
  email: "taxhacker@localhost",
  name: "Self-Hosted Mode",
  membershipPlan: "unlimited",
}

export const getSelfHostedUser = cache(async () => {
  if (!process.env.DATABASE_URL) {
    return null // fix for CI, do not remove
  }

  return await prisma.user.findFirst({
    where: { email: SELF_HOSTED_USER.email },
  })
})

export const getOrCreateSelfHostedUser = cache(async () => {
  return await prisma.user.upsert({
    where: { email: SELF_HOSTED_USER.email },
    update: SELF_HOSTED_USER,
    create: SELF_HOSTED_USER,
  })
})

export function getOrCreateCloudUser(email: string, data: Prisma.UserCreateInput) {
  return prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: data,
    create: data,
  })
}

export const getUserById = cache(async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
  })
})

export const getUserByEmail = cache(async (email: string) => {
  return await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })
})

export const getUserByStripeCustomerId = cache(async (customerId: string) => {
  return await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  })
})

export function updateUser(userId: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({
    where: { id: userId },
    data,
  })
}
