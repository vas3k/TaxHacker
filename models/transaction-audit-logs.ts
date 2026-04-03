import { prisma } from "@/lib/db"
import { TransactionAuditLog, Prisma } from "@/prisma/client"
import { cache } from "react"

export type AuditAction = "created" | "manual_edit" | "csv_merge" | "match_reviewed"

export type AuditLogData = {
  transactionId: string
  userId: string
  action: AuditAction
  fieldName?: string | null
  oldValue?: any
  newValue?: any
  metadata?: Record<string, unknown>
}

/**
 * Create a single audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<TransactionAuditLog> {
  return await prisma.transactionAuditLog.create({
    data: {
      transactionId: data.transactionId,
      userId: data.userId,
      action: data.action,
      fieldName: data.fieldName,
      oldValue: data.oldValue ? JSON.parse(JSON.stringify(data.oldValue)) : null,
      newValue: data.newValue ? JSON.parse(JSON.stringify(data.newValue)) : null,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
    },
  })
}

/**
 * Create multiple audit log entries in a batch
 */
export async function createAuditLogs(logs: AuditLogData[]): Promise<Prisma.BatchPayload> {
  return await prisma.transactionAuditLog.createMany({
    data: logs.map((log) => ({
      transactionId: log.transactionId,
      userId: log.userId,
      action: log.action,
      fieldName: log.fieldName,
      oldValue: log.oldValue ? JSON.parse(JSON.stringify(log.oldValue)) : null,
      newValue: log.newValue ? JSON.parse(JSON.stringify(log.newValue)) : null,
      metadata: log.metadata ? JSON.parse(JSON.stringify(log.metadata)) : null,
    })),
  })
}

/**
 * Get audit logs for a specific transaction
 * @param transactionId - The transaction ID
 * @param limit - Optional limit on number of results
 */
export const getAuditLogsForTransaction = cache(
  async (transactionId: string, limit?: number): Promise<TransactionAuditLog[]> => {
    return await prisma.transactionAuditLog.findMany({
      where: {
        transactionId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })
  }
)

/**
 * Count total audit logs for a transaction
 */
export const countAuditLogsForTransaction = cache(
  async (transactionId: string): Promise<number> => {
    return await prisma.transactionAuditLog.count({
      where: {
        transactionId,
      },
    })
  }
)
