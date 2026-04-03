import { prisma } from "@/lib/db"
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
        where.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { merchant: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
          { note: { contains: filters.search, mode: "insensitive" } },
          { text: { contains: filters.search, mode: "insensitive" } },
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
          matches: {
            select: {
              id: true,
              status: true,
              confidence: true,
              createdAt: true,
              batchId: true,
              batch: {
                select: {
                  filename: true,
                  metadata: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          auditLogs: {
            select: {
              action: true,
              metadata: true,
              createdAt: true,
            },
            where: {
              action: 'created',
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
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
          matches: {
            select: {
              id: true,
              status: true,
              confidence: true,
              createdAt: true,
              batchId: true,
              batch: {
                select: {
                  filename: true,
                  metadata: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          auditLogs: {
            select: {
              action: true,
              metadata: true,
              createdAt: true,
            },
            where: {
              action: 'created',
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy,
      })
      return { transactions, total: transactions.length }
    }
  }
)

export const getTransactionById = cache(async (
  id: string,
  userId: string,
  options?: { auditLogLimit?: number }
): Promise<Transaction | null> => {
  const auditLogLimit = options?.auditLogLimit ?? 50 // Default to 50 most recent audit logs

  return await prisma.transaction.findUnique({
    where: { id, userId },
    include: {
      category: true,
      project: true,
      matches: {
        select: {
          id: true,
          status: true,
          confidence: true,
          matchedAmount: true,
          matchedDate: true,
          createdAt: true,
          reviewedAt: true,
          reviewedBy: true,
          batchId: true,
          batch: {
            select: {
              filename: true,
              createdAt: true,
              metadata: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      auditLogs: {
        orderBy: {
          createdAt: 'desc',
        },
        take: auditLogLimit,
      },
    },
  })
})

/**
 * Get audit logs for a transaction with pagination
 */
export const getTransactionAuditLogs = cache(async (
  transactionId: string,
  userId: string,
  options?: { limit?: number; offset?: number }
) => {
  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0

  // Verify the transaction belongs to the user
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId, userId },
    select: { id: true },
  })

  if (!transaction) {
    return { logs: [], total: 0 }
  }

  const [logs, total] = await Promise.all([
    prisma.transactionAuditLog.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.transactionAuditLog.count({
      where: { transactionId },
    }),
  ])

  return { logs, total }
})

export const getTransactionsByIds = async (userId: string, ids: string[]): Promise<Transaction[]> => {
  if (!ids.length) {
    return []
  }

  return await prisma.transaction.findMany({
    where: {
      userId,
      id: {
        in: ids,
      },
    },
  })
}

export const getTransactionsByFileId = cache(async (fileId: string, userId: string): Promise<Transaction[]> => {
  return await prisma.transaction.findMany({
    where: { files: { array_contains: [fileId] }, userId },
  })
})

/**
 * Validate that required fields are present in transaction data
 * Throws an error if validation fails
 */
async function validateRequiredFields(userId: string, data: TransactionData): Promise<void> {
  const fields = await getFields(userId)
  const errors: string[] = []

  // Check required standard fields
  for (const field of fields) {
    if (field.isRequired && !field.isExtra) {
      const value = data[field.code]
      if (value === null || value === undefined || value === '') {
        errors.push(`Required field '${field.name}' (${field.code}) is missing`)
      }
    }
  }

  // Check required extra fields (stored in extra JSON)
  for (const field of fields) {
    if (field.isRequired && field.isExtra) {
      const value = data.extra?.[field.code]
      if (value === null || value === undefined || value === '') {
        errors.push(`Required custom field '${field.name}' (${field.code}) is missing`)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Transaction validation failed:\n${errors.join('\n')}`)
  }
}

export const createTransaction = async (userId: string, data: TransactionData): Promise<Transaction> => {
  // Validate required fields before creating
  await validateRequiredFields(userId, data)

  const { standard, extra } = await splitTransactionDataExtraFields(data, userId)

  return await prisma.transaction.create({
    data: {
      ...standard,
      extra: extra,
      items: data.items as Prisma.InputJsonValue,
      userId,
    },
  })
}

export const updateTransaction = async (id: string, userId: string, data: TransactionData): Promise<Transaction> => {
  // For updates, fetch existing transaction and merge with new data
  const existing = await getTransactionById(id, userId)
  if (!existing) {
    throw new Error('Transaction not found')
  }

  // Merge existing data with update data
  const mergedData: TransactionData = {
    ...existing,
    ...data,
    extra: { ...(existing.extra as Record<string, unknown> || {}), ...(data.extra || {}) },
  }

  // Validate required fields on merged data
  await validateRequiredFields(userId, mergedData)

  const { standard, extra } = await splitTransactionDataExtraFields(data, userId)

  return await prisma.transaction.update({
    where: { id, userId },
    data: {
      ...standard,
      extra: extra,
      items: data.items ? (data.items as Prisma.InputJsonValue) : [],
    },
  })
}

export const updateTransactionFiles = async (id: string, userId: string, files: string[]): Promise<Transaction> => {
  return await prisma.transaction.update({
    where: { id, userId },
    data: { files },
  })
}

export const deleteTransaction = async (id: string, userId: string): Promise<Transaction | undefined> => {
  const transaction = await getTransactionById(id, userId)

  if (transaction) {
    const files = Array.isArray(transaction.files) ? transaction.files : []

    for (const fileId of files as string[]) {
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

const splitTransactionDataExtraFields = async (
  data: TransactionData,
  userId: string
): Promise<{ standard: TransactionData; extra: Prisma.InputJsonValue }> => {
  // Built-in Transaction model fields (from Prisma schema)
  // These should always be included in standard, even if not in custom fields
  const builtInFields = new Set([
    'name',
    'description',
    'merchant',
    'total',
    'currencyCode',
    'convertedTotal',
    'convertedCurrencyCode',
    'type',
    'categoryCode',
    'projectCode',
    'issuedAt',
    'text',
    'note',
    'importReference',
  ])

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
    // Skip special fields that are handled separately (items, files, extra)
    if (key === 'items' || key === 'files' || key === 'extra') {
      return
    }

    // Built-in fields always go to standard
    if (builtInFields.has(key)) {
      standard[key] = value
    } else {
      // Custom fields from the fields table
      const fieldDef = fieldMap[key]
      if (fieldDef) {
        if (fieldDef.isExtra) {
          extra[key] = value
        } else {
          standard[key] = value
        }
      } else {
        // Unknown fields go to extra
        extra[key] = value
      }
    }
  })

  // Merge existing extra field if present
  if (data.extra) {
    Object.assign(extra, data.extra)
  }

  return { standard, extra: extra as Prisma.InputJsonValue }
}
