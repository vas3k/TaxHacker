"use server"

import { prisma } from "@/lib/db"
import { unlink } from "fs/promises"
import { safePathJoin, FILE_UPLOAD_PATH } from "@/lib/files"
import path from "path"
import { cache } from "react"
import { getTransactionById } from "./transactions"

export const getUnsortedFiles = cache(async (userId: string) => {
  return await prisma.file.findMany({
    where: {
      isReviewed: false,
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
})

export const getUnsortedFilesCount = cache(async (userId: string) => {
  return await prisma.file.count({
    where: {
      isReviewed: false,
      userId,
    },
  })
})

export const getFileById = cache(async (id: string, userId: string) => {
  return await prisma.file.findFirst({
    where: { id, userId },
  })
})

export const getFilesByTransactionId = cache(async (id: string, userId: string) => {
  const transaction = await getTransactionById(id, userId)
  if (transaction && transaction.files) {
    return await prisma.file.findMany({
      where: {
        id: {
          in: transaction.files as string[],
        },
        userId,
      },
      orderBy: {
        createdAt: "asc",
      },
    })
  }
  return []
})

export const createFile = async (userId: string, data: any) => {
  return await prisma.file.create({
    data: {
      ...data,
      userId,
    },
  })
}

export const updateFile = async (id: string, userId: string, data: any) => {
  return await prisma.file.update({
    where: { id, userId },
    data,
  })
}

export const deleteFile = async (id: string, userId: string) => {
  const file = await getFileById(id, userId)
  if (!file) {
    return
  }

  try {
    // Use safePathJoin to prevent path traversal attacks (issue #75).
    // file.path is relative to the user's uploads directory.
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    const userUploadsDir = safePathJoin(FILE_UPLOAD_PATH, user.email)
    const fullPath = safePathJoin(userUploadsDir, file.path)
    await unlink(fullPath)
  } catch (error) {
    console.error("Error deleting file:", error)
  }

  return await prisma.file.delete({
    where: { id, userId },
  })
}
