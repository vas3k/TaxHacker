import { prisma } from "@/lib/db"
import { codeFromName } from "@/lib/utils"
import { Prisma } from "@prisma/client"
import { cache } from "react"

export const getFields = cache(async () => {
  return await prisma.field.findMany({
    orderBy: {
      createdAt: "asc",
    },
  })
})

export const createField = async (field: Prisma.FieldCreateInput) => {
  if (!field.code) {
    field.code = codeFromName(field.name as string)
  }
  return await prisma.field.create({
    data: field,
  })
}

export const updateField = async (code: string, field: Prisma.FieldUpdateInput) => {
  return await prisma.field.update({
    where: { code },
    data: field,
  })
}

export const deleteField = async (code: string) => {
  return await prisma.field.delete({
    where: { code },
  })
}
