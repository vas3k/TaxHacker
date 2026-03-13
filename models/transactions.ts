import { prisma } from "@/lib/db"
import {
  buildSearchFilters,
  isSQLite,
  parseFilesArray,
  prepareJsonField,
} from "@/lib/db-compat"
import { Field, Prisma, Transaction } from "@/prisma/client"
import { cache } from "react"
import { getFields } from "./fields"
import { deleteFile } from "./files"

export type TransactionData = {
  name?: string | null
  description?: string | null
  merchant?: string | null
  total?: number | null
  currencyCode?: string | null
  convertedTotal?: number | null
  convertedCurrencyCode?: string | null
  type?: string | null
  items?: TransactionData[] | undefined
  note?: string | null
  files?: string[] | undefined
  extra?: Record<string, unknown>
  categoryCode?: string | null
  projectCode?: string | null
  issuedAt?: Date | string | null
  text?: string | null
  [key: string]: unknown
}

export type TransactionFilters = {
  search?: string
  dateFrom?: string
  dateTo?: string
  ordering?: string
  categoryCode?: string
  projectCode?: string
  type?: string
  page?: number
}

export type TransactionPagination = {
  limit: number
  offset: number
}

export const getTransactions = cache(
  async (
    userId: string,
    filters?: TransactionFilters,
    pagination?: TransactionPagination
  ): Promise<{
    transactions: Transaction[]
    total: number
  }> => {
    const where: Prisma.TransactionWhereInput = { userId }
    let orderBy: Prisma.TransactionOrderByWithRelationInput = { issuedAt: "desc" }

    if (filters) {
      if (filters.search) {
        where.OR = buildSearchFilters(
          ["name", "merchant", "description", "note", "text"],
          filters.search
        )
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

      if (filters.type) {
        where.type = filters.type
      }

      if (filters.ordering) {
        const isDesc = filters.ordering.startsWith("-")
        const field = isDesc ? filters.ordering.slice(1) : filters.ordering
        orderBy = { [field]: isDesc ? "desc" : "asc" }
      }
    }

    if (pagination) {
      const total = await prisma.transaction.count({ where })
      const transactions = await prisma.transaction.findMany({
        where,
        include: {
          category: true,
          project: true,
        },
        orderBy,
        take: pagination?.limit,
        skip: pagination?.offset,
      })
      return { transactions, total }
    } else {
      const transactions = await prisma.transaction.findMany({
        where,
        include: {
          category: true,
          project: true,
        },
        orderBy,
      })
      return { transactions, total: transactions.length }
    }
  }
)

export const getTransactionById = cache(async (id: string, userId: string): Promise<Transaction | null> => {
  return await prisma.transaction.findUnique({
    where: { id, userId },
    include: {
      category: true,
      project: true,
    },
  })
})

export const getTransactionsByFileId = cache(async (fileId: string, userId: string): Promise<Transaction[]> => {
  if (isSQLite) {
    // SQLite: files is stored as JSON string, use contains
    return await prisma.transaction.findMany({
      where: {
        files: { contains: fileId },
        userId,
      },
    })
  }
  // PostgreSQL: use native JSON array_contains
  // Using type assertion because Prisma generates different types based on schema
  return await prisma.transaction.findMany({
    where: { files: { array_contains: [fileId] } as unknown, userId } as Prisma.TransactionWhereInput,
  })
})

export const createTransaction = async (userId: string, data: TransactionData): Promise<Transaction> => {
  const { standard, extra } = await splitTransactionDataExtraFields(data, userId)

  return await prisma.transaction.create({
    data: {
      ...standard,
      extra: prepareJsonField(extra),
      items: prepareJsonField(data.items || []),
      user: { connect: { id: userId } },
    } as unknown as Prisma.TransactionCreateInput,
  })
}

export const updateTransaction = async (id: string, userId: string, data: TransactionData): Promise<Transaction> => {
  const { standard, extra } = await splitTransactionDataExtraFields(data, userId)

  return await prisma.transaction.update({
    where: { id, userId },
    data: {
      ...standard,
      extra: prepareJsonField(extra),
      items: prepareJsonField(data.items || []),
    } as unknown as Prisma.TransactionUpdateInput,
  })
}

export const updateTransactionFiles = async (id: string, userId: string, files: string[]): Promise<Transaction> => {
  return await prisma.transaction.update({
    where: { id, userId },
    data: { files: prepareJsonField(files) } as unknown as Prisma.TransactionUpdateInput,
  })
}

export const deleteTransaction = async (id: string, userId: string): Promise<Transaction | undefined> => {
  const transaction = await getTransactionById(id, userId)

  if (transaction) {
    const files = parseFilesArray(transaction.files)

    for (const fileId of files) {
      if ((await getTransactionsByFileId(fileId, userId)).length <= 1) {
        await deleteFile(fileId, userId)
      }
    }

    return await prisma.transaction.delete({
      where: { id, userId },
    })
  }
}

export const bulkDeleteTransactions = async (ids: string[], userId: string) => {
  return await prisma.transaction.deleteMany({
    where: { id: { in: ids }, userId },
  })
}

export const duplicateTransaction = async (id: string, userId: string): Promise<Transaction> => {
  const original = await getTransactionById(id, userId)
  if (!original) {
    throw new Error("Transaction not found")
  }

  // Create a copy without id, timestamps, files, and relations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    files: _files,
    items: _items,
    extra: _extra,
    ...rest
  } = original as Transaction & { category?: unknown; project?: unknown }

  // Remove relation fields if present (from include)
  const { category: _category, project: _project, ...transactionData } = rest as typeof rest & {
    category?: unknown
    project?: unknown
  }

  return await prisma.transaction.create({
    data: {
      ...transactionData,
      name: original.name ? `${original.name} (Copy)` : "Copy",
      files: prepareJsonField([]),
      items: original.items,
      extra: original.extra,
      user: { connect: { id: userId } },
    } as unknown as Prisma.TransactionCreateInput,
  })
}

const splitTransactionDataExtraFields = async (
  data: TransactionData,
  userId: string
): Promise<{ standard: TransactionData; extra: Prisma.InputJsonValue }> => {
  const fields = await getFields(userId)
  const fieldMap = fields.reduce(
    (acc, field) => {
      acc[field.code] = field
      return acc
    },
    {} as Record<string, Field>
  )

  const standard: TransactionData = {}
  const extra: Record<string, unknown> = {}

  Object.entries(data).forEach(([key, value]) => {
    const fieldDef = fieldMap[key]
    if (fieldDef) {
      if (fieldDef.isExtra) {
        extra[key] = value
      } else {
        standard[key] = value
      }
    }
  })

  return { standard, extra: extra as Prisma.InputJsonValue }
}
