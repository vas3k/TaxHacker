import { prisma } from "@/lib/db"
import { codeFromName } from "@/lib/utils"
import { Prisma } from "@/prisma/client"
import { cache } from "react"

export type FieldData = {
  [key: string]: unknown
}

export const getFields = cache(async (userId: string) => {
  return await prisma.field.findMany({
    where: { userId },
    orderBy: [
      { order: "asc" },
      { createdAt: "asc" },
    ],
  })
})

export const createField = async (userId: string, field: FieldData) => {
  if (!field.code) {
    field.code = codeFromName(field.name as string)
  }
  return await prisma.field.create({
    data: {
      ...field,
      user: {
        connect: {
          id: userId,
        },
      },
    } as Prisma.FieldCreateInput,
  })
}

export const updateField = async (userId: string, code: string, field: FieldData) => {
  return await prisma.field.update({
    where: { userId_code: { code, userId } },
    data: field,
  })
}

export const deleteField = async (userId: string, code: string) => {
  return await prisma.field.delete({
    where: { userId_code: { code, userId } },
  })
}

export const updateFieldOrders = async (userId: string, fieldOrders: { code: string; order: number }[]) => {
  // Use a transaction to update all field orders atomically
  return await prisma.$transaction(
    fieldOrders.map(({ code, order }) =>
      prisma.field.update({
        where: { userId_code: { code, userId } },
        data: { order },
      })
    )
  )
}
