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
    include: {
      children: true,
    },
  })
})

// Get categories in hierarchical structure (parent categories first, then children)
export const getCategoriesHierarchical = cache(async (userId: string) => {
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: {
      name: "asc",
    },
  })

  // Build hierarchical structure
  const parentCategories = categories.filter((c) => !c.parentCode)
  const childCategories = categories.filter((c) => c.parentCode)

  // Group children by parent
  const childrenByParent = childCategories.reduce(
    (acc, child) => {
      if (!acc[child.parentCode!]) {
        acc[child.parentCode!] = []
      }
      acc[child.parentCode!].push(child)
      return acc
    },
    {} as Record<string, typeof categories>
  )

  return { parentCategories, childrenByParent, allCategories: categories }
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
