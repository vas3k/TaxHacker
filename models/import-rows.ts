import { prisma } from "@/lib/db"
import { ImportRow, Prisma } from "@/prisma/client"
import { cache } from "react"

export type ImportRowData = {
  batchId: string
  rowNumber: number
  rawData: Record<string, unknown>
  parsedData?: Record<string, unknown>
  status?: string
  errorMessage?: string | null
  transactionId?: string | null
}

/**
 * Create a new import row
 */
export const createImportRow = async (data: ImportRowData): Promise<ImportRow> => {
  return await prisma.importRow.create({
    data: {
      batchId: data.batchId,
      rowNumber: data.rowNumber,
      rawData: data.rawData as Prisma.InputJsonValue,
      parsedData: data.parsedData as Prisma.InputJsonValue,
      status: data.status || "pending",
      errorMessage: data.errorMessage || null,
      transactionId: data.transactionId || null,
    },
  })
}

/**
 * Create multiple import rows in bulk
 */
export const createImportRows = async (rows: ImportRowData[]): Promise<Prisma.BatchPayload> => {
  return await prisma.importRow.createMany({
    data: rows.map((row) => ({
      batchId: row.batchId,
      rowNumber: row.rowNumber,
      rawData: row.rawData as Prisma.InputJsonValue,
      parsedData: row.parsedData as Prisma.InputJsonValue,
      status: row.status || "pending",
      errorMessage: row.errorMessage || null,
      transactionId: row.transactionId || null,
    })),
  })
}

/**
 * Get an import row by ID
 */
export const getImportRowById = cache(async (id: string): Promise<ImportRow | null> => {
  return await prisma.importRow.findUnique({
    where: { id },
    include: {
      batch: true,
    },
  })
})

/**
 * Get all import rows for a batch
 */
export const getImportRowsByBatch = cache(
  async (batchId: string, status?: string): Promise<ImportRow[]> => {
    return await prisma.importRow.findMany({
      where: {
        batchId,
        ...(status && { status }),
      },
      orderBy: { rowNumber: "asc" },
    })
  }
)

/**
 * Get import rows by status for a batch
 */
export const getImportRowsByStatus = cache(
  async (batchId: string, status: string): Promise<ImportRow[]> => {
    return await prisma.importRow.findMany({
      where: {
        batchId,
        status,
      },
      orderBy: { rowNumber: "asc" },
    })
  }
)

/**
 * Update an import row
 */
export const updateImportRow = async (
  id: string,
  data: Partial<ImportRowData>
): Promise<ImportRow> => {
  return await prisma.importRow.update({
    where: { id },
    data: {
      ...(data.parsedData && { parsedData: data.parsedData as Prisma.InputJsonValue }),
      ...(data.status && { status: data.status }),
      ...(data.errorMessage !== undefined && { errorMessage: data.errorMessage }),
      ...(data.transactionId !== undefined && { transactionId: data.transactionId }),
    },
  })
}

/**
 * Mark an import row as processed with transaction ID
 */
export const markRowProcessed = async (
  id: string,
  transactionId: string,
  status: "matched" | "created"
): Promise<ImportRow> => {
  return await prisma.importRow.update({
    where: { id },
    data: {
      status,
      transactionId,
    },
  })
}

/**
 * Mark an import row as error
 */
export const markRowError = async (id: string, errorMessage: string): Promise<ImportRow> => {
  return await prisma.importRow.update({
    where: { id },
    data: {
      status: "error",
      errorMessage,
    },
  })
}

/**
 * Mark an import row as skipped
 */
export const markRowSkipped = async (id: string, reason?: string): Promise<ImportRow> => {
  return await prisma.importRow.update({
    where: { id },
    data: {
      status: "skipped",
      errorMessage: reason,
    },
  })
}

/**
 * Count rows by status for a batch
 */
export const countRowsByStatus = cache(
  async (batchId: string): Promise<Record<string, number>> => {
    const counts = await prisma.importRow.groupBy({
      by: ["status"],
      where: { batchId },
      _count: true,
    })

    return counts.reduce(
      (acc, item) => {
        acc[item.status] = item._count
        return acc
      },
      {} as Record<string, number>
    )
  }
)

/**
 * Delete all import rows for a batch
 */
export const deleteImportRowsByBatch = async (batchId: string): Promise<Prisma.BatchPayload> => {
  return await prisma.importRow.deleteMany({
    where: { batchId },
  })
}
