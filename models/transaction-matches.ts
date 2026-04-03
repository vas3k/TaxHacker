import { prisma } from "@/lib/db"
import { TransactionMatch, Prisma } from "@/prisma/client"
import { cache } from "react"

const transactionInclude = {
  category: true,
  project: true,
} as const

const matchWithTransactionInclude = {
  transaction: {
    include: {
      ...transactionInclude,
      matches: {
        include: {
          batch: {
            select: {
              metadata: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc' as const,
        },
        take: 1,
      },
    },
  },
} as const

const matchWithTransactionAndBatchInclude = {
  ...matchWithTransactionInclude,
  batch: true,
} as const

export type TransactionMatchWithTransaction = Prisma.TransactionMatchGetPayload<{
  include: typeof matchWithTransactionInclude
}>

type TransactionMatchWithTransactionAndBatch = Prisma.TransactionMatchGetPayload<{
  include: typeof matchWithTransactionAndBatchInclude
}>

export type TransactionMatchData = {
  batchId: string
  transactionId: string
  confidence: number
  matchedAmount: number
  matchedDate: Date
  existingDate: Date
  daysDifference: number
  status?: string
  csvData: Record<string, unknown>
  mergedFields?: string[]
  reviewedBy?: string | null
  reviewedAt?: Date | null
}

/**
 * Create a new transaction match record
 */
export const createTransactionMatch = async (
  data: TransactionMatchData
): Promise<TransactionMatch> => {
  return await prisma.transactionMatch.create({
    data: {
      batchId: data.batchId,
      transactionId: data.transactionId,
      confidence: data.confidence,
      matchedAmount: data.matchedAmount,
      matchedDate: data.matchedDate,
      existingDate: data.existingDate,
      daysDifference: data.daysDifference,
      status: data.status || (data.confidence >= 90 ? "auto_merged" : "flagged"),
      csvData: data.csvData as Prisma.InputJsonValue,
      mergedFields: (data.mergedFields || []) as Prisma.InputJsonValue,
      reviewedBy: data.reviewedBy || null,
      reviewedAt: data.reviewedAt || null,
    },
  })
}

/**
 * Get a transaction match by ID
 */
export const getTransactionMatchById = cache(
  async (id: string): Promise<TransactionMatchWithTransactionAndBatch | null> => {
    return await prisma.transactionMatch.findUnique({
      where: { id },
      include: matchWithTransactionAndBatchInclude,
    })
  }
)

/**
 * Get all transaction matches for a batch
 */
export const getTransactionMatchesByBatch = cache(
  async (batchId: string, status?: string): Promise<TransactionMatchWithTransaction[]> => {
    return await prisma.transactionMatch.findMany({
      where: {
        batchId,
        ...(status && { status }),
      },
      include: matchWithTransactionInclude,
      orderBy: { confidence: "desc" },
    })
  }
)

/**
 * Get flagged matches for a batch (requires manual review)
 */
export const getFlaggedMatches = cache(async (batchId: string): Promise<TransactionMatchWithTransaction[]> => {
  return await prisma.transactionMatch.findMany({
    where: {
      batchId,
      status: "flagged",
    },
    include: matchWithTransactionInclude,
    orderBy: { confidence: "desc" },
  })
})

/**
 * Get auto-merged matches for a batch
 */
export const getAutoMergedMatches = cache(
  async (batchId: string): Promise<TransactionMatchWithTransaction[]> => {
    return await prisma.transactionMatch.findMany({
      where: {
        batchId,
        status: "auto_merged",
      },
      include: matchWithTransactionInclude,
      orderBy: { createdAt: "desc" },
    })
  }
)

/**
 * Get all matches for a specific transaction
 */
export const getMatchesForTransaction = cache(
  async (transactionId: string): Promise<TransactionMatch[]> => {
    return await prisma.transactionMatch.findMany({
      where: { transactionId },
      include: {
        batch: true,
      },
      orderBy: { createdAt: "desc" },
    })
  }
)

/**
 * Update a transaction match
 */
export const updateTransactionMatch = async (
  id: string,
  data: Partial<TransactionMatchData>
): Promise<TransactionMatch> => {
  return await prisma.transactionMatch.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.mergedFields && { mergedFields: data.mergedFields as Prisma.InputJsonValue }),
      ...(data.reviewedBy !== undefined && { reviewedBy: data.reviewedBy }),
      ...(data.reviewedAt !== undefined && { reviewedAt: data.reviewedAt }),
    },
  })
}

/**
 * Mark a flagged match as reviewed and merged
 */
export const approveMatch = async (
  id: string,
  userId: string,
  mergedFields?: string[]
): Promise<TransactionMatch> => {
  return await prisma.transactionMatch.update({
    where: { id },
    data: {
      status: "reviewed_merged",
      reviewedBy: userId,
      reviewedAt: new Date(),
      ...(mergedFields && { mergedFields: mergedFields as Prisma.InputJsonValue }),
    },
  })
}

/**
 * Mark a flagged match as rejected (don't merge)
 */
export const rejectMatch = async (id: string, userId: string): Promise<TransactionMatch> => {
  return await prisma.transactionMatch.update({
    where: { id },
    data: {
      status: "reviewed_rejected",
      reviewedBy: userId,
      reviewedAt: new Date(),
    },
  })
}

/**
 * Count matches by status for a batch
 */
export const countMatchesByStatus = cache(
  async (batchId: string): Promise<Record<string, number>> => {
    const counts = await prisma.transactionMatch.groupBy({
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
 * Count flagged matches for a batch
 */
export const countFlaggedMatches = cache(async (batchId: string): Promise<number> => {
  return await prisma.transactionMatch.count({
    where: {
      batchId,
      status: "flagged",
    },
  })
})

/**
 * Delete a transaction match
 */
export const deleteTransactionMatch = async (id: string): Promise<TransactionMatch> => {
  return await prisma.transactionMatch.delete({
    where: { id },
  })
}

/**
 * Delete all transaction matches for a batch
 */
export const deleteTransactionMatchesByBatch = async (
  batchId: string
): Promise<Prisma.BatchPayload> => {
  return await prisma.transactionMatch.deleteMany({
    where: { batchId },
  })
}

/**
 * Undo/revert a merge by marking the match as undone
 * This doesn't actually revert the transaction data, just marks the match as undone
 * so it can be reviewed again or manually reverted
 */
export const undoMatch = async (id: string, userId: string): Promise<TransactionMatch> => {
  return await prisma.transactionMatch.update({
    where: { id },
    data: {
      status: "undone",
      reviewedBy: userId,
      reviewedAt: new Date(),
    },
  })
}
