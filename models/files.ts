"use server"

import { prisma } from "@/lib/db"
import { unlink } from "fs/promises"
import path from "path"
import { cache } from "react"
import { getTransactionById } from "./transactions"

export const getUnsortedFiles = cache(async () => {
  return await prisma.file.findMany({
    where: {
      isReviewed: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
})

export const getUnsortedFilesCount = cache(async () => {
  return await prisma.file.count({
    where: {
      isReviewed: false,
    },
  })
})

export const getFileById = cache(async (id: string) => {
  return await prisma.file.findFirst({
    where: { id },
  })
})

export const getFilesByTransactionId = cache(async (id: string) => {
  const transaction = await getTransactionById(id)
  if (transaction && transaction.files) {
    return await prisma.file.findMany({
      where: {
        id: {
          in: transaction.files as string[],
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })
  }
  return []
})

export const createFile = async (data: any) => {
  return await prisma.file.create({
    data,
  })
}

export const updateFile = async (id: string, data: any) => {
  return await prisma.file.update({
    where: { id },
    data,
  })
}

export const deleteFile = async (id: string) => {
  const file = await getFileById(id)
  if (!file) {
    return
  }

  try {
    await unlink(path.resolve(file.path))
  } catch (error) {
    console.error("Error deleting file:", error)
  }

  return await prisma.file.delete({
    where: { id },
  })
}
