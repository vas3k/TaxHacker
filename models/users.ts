import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { cache } from "react"

export const SELF_HOSTED_USER = {
  email: "taxhacker@localhost",
  name: "Self-Hosted Mode",
}

export const getSelfHostedUser = cache(async () => {
  return await prisma.user.findFirst({
    where: { email: SELF_HOSTED_USER.email },
  })
})

export const createSelfHostedUser = cache(async () => {
  return await prisma.user.upsert({
    where: { email: SELF_HOSTED_USER.email },
    update: SELF_HOSTED_USER,
    create: SELF_HOSTED_USER,
  })
})

export const getUserByEmail = cache(async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
  })
})

export function updateUser(userId: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({
    where: { id: userId },
    data,
  })
}
