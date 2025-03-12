import { prisma } from "@/lib/db"
import { Field, Prisma, Transaction } from "@prisma/client"
import { cache } from "react"
import { getFields } from "./fields"
import { deleteFile } from "./files"

export type TransactionData = {
  [key: string]: unknown
}

export type TransactionFilters = {
  search?: string
  dateFrom?: string
  dateTo?: string
  ordering?: string
  categoryCode?: string
  projectCode?: string
}

export const getTransactions = cache(async (filters?: TransactionFilters): Promise<Transaction[]> => {
  const where: Prisma.TransactionWhereInput = {}
  let orderBy: Prisma.TransactionOrderByWithRelationInput = { issuedAt: "desc" }

  if (filters) {
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { merchant: { contains: filters.search } },
        { description: { contains: filters.search } },
        { note: { contains: filters.search } },
        { text: { contains: filters.search } },
      ]
    }

    if (filters.dateFrom || filters.dateTo) {
      where.issuedAt = {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }
    }

    if (filters.categoryCode) {
      where.categoryCode = filters.categoryCode
    }

    if (filters.projectCode) {
      where.projectCode = filters.projectCode
    }

    if (filters.ordering) {
      const isDesc = filters.ordering.startsWith("-")
      const field = isDesc ? filters.ordering.slice(1) : filters.ordering
      orderBy = { [field]: isDesc ? "desc" : "asc" }
    }
  }

  return await prisma.transaction.findMany({
    where,
    include: {
      category: true,
      project: true,
    },
    orderBy,
  })
})

export const getTransactionById = cache(async (id: string): Promise<Transaction | null> => {
  return await prisma.transaction.findUnique({
    where: { id },
    include: {
      category: true,
      project: true,
    },
  })
})

export const createTransaction = async (data: TransactionData): Promise<Transaction> => {
  const { standard, extra } = await splitTransactionDataExtraFields(data)

  return await prisma.transaction.create({
    data: {
      ...standard,
      extra: extra,
    },
  })
}

export const updateTransaction = async (id: string, data: TransactionData): Promise<Transaction> => {
  const { standard, extra } = await splitTransactionDataExtraFields(data)

  return await prisma.transaction.update({
    where: { id },
    data: {
      ...standard,
      extra: extra,
    },
  })
}

export const updateTransactionFiles = async (id: string, files: string[]): Promise<Transaction> => {
  return await prisma.transaction.update({
    where: { id },
    data: { files },
  })
}

export const deleteTransaction = async (id: string): Promise<Transaction | undefined> => {
  const transaction = await getTransactionById(id)

  if (transaction) {
    const files = Array.isArray(transaction.files) ? transaction.files : []

    for (const fileId of files as string[]) {
      await deleteFile(fileId)
    }

    return await prisma.transaction.delete({
      where: { id },
    })
  }
}

const splitTransactionDataExtraFields = async (
  data: TransactionData
): Promise<{ standard: TransactionData; extra: Prisma.InputJsonValue }> => {
  const fields = await getFields()
  const fieldMap = fields.reduce((acc, field) => {
    acc[field.code] = field
    return acc
  }, {} as Record<string, Field>)

  const standard: Omit<Partial<Transaction>, "extra"> = {}
  const extra: Record<string, unknown> = {}

  Object.entries(data).forEach(([key, value]) => {
    const fieldDef = fieldMap[key]
    if (fieldDef) {
      if (fieldDef.isExtra) {
        extra[key] = value
      } else {
        standard[key as keyof Omit<Transaction, "extra">] = value as any
      }
    }
  })

  return { standard, extra: extra as Prisma.InputJsonValue }
}
