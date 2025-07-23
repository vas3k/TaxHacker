import { prisma } from "@/lib/db"
import { codeFromName } from "@/lib/utils"
import { Prisma } from "@/prisma/client"
import { cache } from "react"

export type CategoryData = {
  [key: string]: unknown
}

export const getCategories = cache(async (userId: string) => {
  return await prisma.category.findMany({
    where: { userId },
    orderBy: {
      name: "asc",
    },
  })
})

export const getCategoryByCode = cache(async (userId: string, code: string) => {
  return await prisma.category.findUnique({
    where: { userId_code: { userId, code } },
  })
})

export const createCategory = async (userId: string, category: CategoryData) => {
  if (!category.code) {
    category.code = codeFromName(category.name as string)
  }
  return await prisma.category.create({
    data: {
      ...category,
      user: {
        connect: {
          id: userId,
        },
      },
    } as Prisma.CategoryCreateInput,
  })
}

export const updateCategory = async (userId: string, code: string, category: CategoryData) => {
  return await prisma.category.update({
    where: { userId_code: { userId, code } },
    data: category,
  })
}

export const deleteCategory = async (userId: string, code: string) => {
  await prisma.transaction.updateMany({
    where: {
      userId,
      categoryCode: code,
    },
    data: {
      categoryCode: null,
    },
  })

  return await prisma.category.delete({
    where: { userId_code: { userId, code } },
  })
}
