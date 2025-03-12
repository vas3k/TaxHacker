import { prisma } from "@/lib/db"
import { codeFromName } from "@/lib/utils"
import { Prisma } from "@prisma/client"
import { cache } from "react"

export const getCategories = cache(async () => {
  return await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  })
})

export const createCategory = async (category: Prisma.CategoryCreateInput) => {
  if (!category.code) {
    category.code = codeFromName(category.name as string)
  }
  return await prisma.category.create({
    data: category,
  })
}

export const updateCategory = async (code: string, category: Prisma.CategoryUpdateInput) => {
  return await prisma.category.update({
    where: { code },
    data: category,
  })
}

export const deleteCategory = async (code: string) => {
  return await prisma.category.delete({
    where: { code },
  })
}
