import { prisma } from "@/lib/db"
import { ImportBatch, Prisma } from "@/prisma/client"
import { cache } from "react"
import crypto from "crypto"

export type ImportBatchData = {
  filename: string
  contentHash?: string | null
  status?: string
  totalRows?: number
  matchedCount?: number
  createdCount?: number
  skippedCount?: number
  errorCount?: number
  metadata?: Record<string, unknown>
  completedAt?: Date | null
}

export type ImportBatchStats = {
  totalRows: number
  matchedCount: number
  createdCount: number
  skippedCount: number
  errorCount: number
}

/**
 * Calculate SHA-256 hash of CSV content for duplicate detection
 * @param content - The CSV file content as string
 * @returns Hash string
 */
export function calculateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

/**
 * Create a new import batch
 */
export const createImportBatch = async (
  userId: string,
  data: ImportBatchData
): Promise<ImportBatch> => {
  return await prisma.importBatch.create({
    data: {
      userId,
      filename: data.filename,
      contentHash: data.contentHash || null,
      status: data.status || "processing",
      totalRows: data.totalRows || 0,
      matchedCount: data.matchedCount || 0,
      createdCount: data.createdCount || 0,
      skippedCount: data.skippedCount || 0,
      errorCount: data.errorCount || 0,
      metadata: data.metadata as Prisma.InputJsonValue,
      completedAt: data.completedAt || null,
    },
  })
}

/**
 * Check if a batch with the same content hash already exists
 * Returns the existing batch if found, null otherwise
 */
export const findDuplicateBatch = cache(
  async (userId: string, contentHash: string): Promise<ImportBatch | null> => {
    return await prisma.importBatch.findFirst({
      where: {
        userId,
        contentHash,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
)

/**
 * Get an import batch by ID
 */
export const getImportBatchById = cache(
  async (id: string, userId: string): Promise<ImportBatch | null> => {
    return await prisma.importBatch.findFirst({
      where: { id, userId },
      include: {
        importRows: {
          orderBy: { rowNumber: "asc" },
          take: 100, // Limit for performance
        },
        transactionMatches: {
          orderBy: { createdAt: "desc" },
          take: 100,
        },
      },
    })
  }
)

/**
 * Get all import batches for a user
 */
export const getImportBatches = cache(
  async (userId: string, limit: number = 50): Promise<ImportBatch[]> => {
    return await prisma.importBatch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  }
)

/**
 * Update an import batch
 */
export const updateImportBatch = async (
  id: string,
  userId: string,
  data: Partial<ImportBatchData>
): Promise<ImportBatch> => {
  return await prisma.importBatch.update({
    where: { id, userId },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.totalRows !== undefined && { totalRows: data.totalRows }),
      ...(data.matchedCount !== undefined && { matchedCount: data.matchedCount }),
      ...(data.createdCount !== undefined && { createdCount: data.createdCount }),
      ...(data.skippedCount !== undefined && { skippedCount: data.skippedCount }),
      ...(data.errorCount !== undefined && { errorCount: data.errorCount }),
      ...(data.metadata && { metadata: data.metadata as Prisma.InputJsonValue }),
      ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
    },
  })
}

/**
 * Increment a counter field in an import batch
 */
export const incrementBatchCount = async (
  id: string,
  userId: string,
  field: "matchedCount" | "createdCount" | "skippedCount" | "errorCount"
): Promise<ImportBatch> => {
  return await prisma.importBatch.update({
    where: { id, userId },
    data: {
      [field]: { increment: 1 },
    },
  })
}

/**
 * Get batch statistics
 */
export const getBatchStats = cache(
  async (id: string, userId: string): Promise<ImportBatchStats | null> => {
    const batch = await prisma.importBatch.findFirst({
      where: { id, userId },
      select: {
        totalRows: true,
        matchedCount: true,
        createdCount: true,
        skippedCount: true,
        errorCount: true,
      },
    })

    return batch
  }
)

/**
 * Mark a batch as completed
 */
export const completeBatch = async (id: string, userId: string): Promise<ImportBatch> => {
  return await prisma.importBatch.update({
    where: { id, userId },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  })
}

/**
 * Mark a batch as completed with errors
 * Use this when the batch finished processing but some rows had errors
 */
export const completeBatchWithErrors = async (
  id: string,
  userId: string
): Promise<ImportBatch> => {
  return await prisma.importBatch.update({
    where: { id, userId },
    data: {
      status: "completed_with_errors",
      completedAt: new Date(),
    },
  })
}

/**
 * Mark a batch as failed
 */
export const failBatch = async (
  id: string,
  userId: string,
  error?: string
): Promise<ImportBatch> => {
  return await prisma.importBatch.update({
    where: { id, userId },
    data: {
      status: "failed",
      completedAt: new Date(),
      metadata: {
        error,
      } as Prisma.InputJsonValue,
    },
  })
}

/**
 * Delete an import batch
 */
export const deleteImportBatch = async (
  id: string,
  userId: string
): Promise<ImportBatch> => {
  return await prisma.importBatch.delete({
    where: { id, userId },
  })
}
