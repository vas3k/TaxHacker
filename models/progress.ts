import { prisma } from "@/lib/db"

export const getOrCreateProgress = async (
  userId: string,
  id: string,
  type: string | null = null,
  data: any = null,
  total: number = 0
) => {
  return await prisma.progress.upsert({
    where: { id },
    create: {
      id,
      user: { connect: { id: userId } },
      type: type || "unknown",
      data,
      total,
    },
    update: {
      // Don't update existing progress
    },
  })
}

export const getProgressById = async (userId: string, id: string) => {
  return await prisma.progress.findFirst({
    where: { id, userId },
  })
}

export const updateProgress = async (
  userId: string,
  id: string,
  fields: { current?: number; total?: number; data?: any }
) => {
  return await prisma.progress.updateMany({
    where: { id, userId },
    data: fields,
  })
}

export const incrementProgress = async (userId: string, id: string, amount: number = 1) => {
  return await prisma.progress.updateMany({
    where: { id, userId },
    data: {
      current: { increment: amount },
    },
  })
}

export const getAllProgressByUser = async (userId: string) => {
  return await prisma.progress.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}

export const deleteProgress = async (userId: string, id: string) => {
  return await prisma.progress.deleteMany({
    where: { id, userId },
  })
}
