"use server"

import { prisma } from "@/lib/db"
import { parseFilesArray, prepareJsonField } from "@/lib/db-compat"
import { unlink } from "fs/promises"
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
    const fileIds = parseFilesArray(transaction.files)
    if (fileIds.length === 0) return []
    return await prisma.file.findMany({
      where: {
        id: { in: fileIds },
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
  // Prepare JSON fields for storage (stringify for SQLite)
  const preparedData = {
    ...data,
    userId,
    metadata: data.metadata ? prepareJsonField(data.metadata) : null,
    cachedParseResult: data.cachedParseResult ? prepareJsonField(data.cachedParseResult) : null,
  }

  return await prisma.file.create({
    data: preparedData,
  })
}

export const updateFile = async (id: string, userId: string, data: any) => {
  // Prepare JSON fields for storage (stringify for SQLite)
  const preparedData = { ...data }
  if (preparedData.metadata !== undefined) {
    preparedData.metadata = preparedData.metadata ? prepareJsonField(preparedData.metadata) : null
  }
  if (preparedData.cachedParseResult !== undefined) {
    preparedData.cachedParseResult = preparedData.cachedParseResult ? prepareJsonField(preparedData.cachedParseResult) : null
  }

  return await prisma.file.update({
    where: { id, userId },
    data: preparedData,
  })
}

export const deleteFile = async (id: string, userId: string) => {
  const file = await getFileById(id, userId)
  if (!file) {
    return
  }

  try {
    await unlink(path.resolve(path.normalize(file.path)))
  } catch (error) {
    console.error("Error deleting file:", error)
  }

  return await prisma.file.delete({
    where: { id, userId },
  })
}
