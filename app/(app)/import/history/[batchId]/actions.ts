"use server"

import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Prisma } from "@/prisma/client"
import { revalidatePath } from "next/cache"

export type ActionState<T> = {
  success: boolean
  data?: T
  error?: string
} | null

/**
 * Approve a flagged match - merge it with the existing transaction
 */
export async function approveMatchAction(matchId: string): Promise<ActionState<void>> {
  try {
    const user = await getCurrentUser()

    // Get the match
    const match = await prisma.transactionMatch.findUnique({
      where: { id: matchId },
      include: {
        batch: true,
        transaction: true,
      },
    })

    if (!match) {
      return { success: false, error: "Match not found" }
    }

    // Verify the batch belongs to the user
    if (match.batch.userId !== user.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Update the match status
    await prisma.transactionMatch.update({
      where: { id: matchId },
      data: {
        status: "reviewed_merged",
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
    })

    // Merge CSV data into the transaction (if needed)
    // This would update the transaction with any missing fields from CSV
    // For now, we just mark it as reviewed

    revalidatePath(`/import/history/${match.batchId}`)
    revalidatePath("/transactions")

    return { success: true }
  } catch (error) {
    console.error("Failed to approve match:", error)
    return { success: false, error: "Failed to approve match" }
  }
}

/**
 * Reject a flagged match - don't merge, keep as separate
 */
export async function rejectMatchAction(matchId: string): Promise<ActionState<void>> {
  try {
    const user = await getCurrentUser()

    // Get the match
    const match = await prisma.transactionMatch.findUnique({
      where: { id: matchId },
      include: {
        batch: true,
      },
    })

    if (!match) {
      return { success: false, error: "Match not found" }
    }

    // Verify the batch belongs to the user
    if (match.batch.userId !== user.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Update the match status
    await prisma.transactionMatch.update({
      where: { id: matchId },
      data: {
        status: "reviewed_rejected",
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
    })

    revalidatePath(`/import/history/${match.batchId}`)

    return { success: true }
  } catch (error) {
    console.error("Failed to reject match:", error)
    return { success: false, error: "Failed to reject match" }
  }
}

/**
 * Get match history for a transaction
 */
export async function getTransactionMatchHistory(transactionId: string) {
  try {
    const user = await getCurrentUser()

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId, userId: user.id },
      include: {
        matches: {
          include: {
            batch: {
              select: {
                filename: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!transaction) {
      return null
    }

    return {
      id: transaction.id,
      name: transaction.name,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      matches: transaction.matches.map((match) => ({
        id: match.id,
        batchId: match.batchId,
        confidence: match.confidence,
        matchedAmount: match.matchedAmount,
        matchedDate: match.matchedDate,
        status: match.status,
        createdAt: match.createdAt,
        reviewedAt: match.reviewedAt,
        reviewedBy: match.reviewedBy,
        batch: match.batch,
      })),
    }
  } catch (error) {
    console.error("Failed to get transaction match history:", error)
    return null
  }
}

export async function deleteImportBatchAction(batchId: string): Promise<ActionState<void>> {
  try {
    const user = await getCurrentUser()

    const batch = await prisma.importBatch.findFirst({
      where: {
        id: batchId,
        userId: user.id,
      },
    })

    if (!batch) {
      return { success: false, error: "Import batch not found" }
    }

    await prisma.$transaction(async (tx) => {
      await deleteBatchCascade(tx, batchId, user.id)
    })

    revalidatePath("/import/history")
    revalidatePath(`/import/history/${batchId}`)
    revalidatePath("/transactions")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete import batch:", error)
    return { success: false, error: "Failed to delete import batch" }
  }
}

export async function deleteImportBatchesAction(batchIds: string[]): Promise<ActionState<void>> {
  try {
    const user = await getCurrentUser()

    if (!Array.isArray(batchIds) || batchIds.length === 0) {
      return { success: false, error: "No import batches selected" }
    }

    const uniqueIds = Array.from(new Set(batchIds))

    const batches = await prisma.importBatch.findMany({
      where: {
        id: { in: uniqueIds },
        userId: user.id,
      },
      select: { id: true },
    })

    if (batches.length !== uniqueIds.length) {
      return { success: false, error: "Some selected imports were not found" }
    }

    await prisma.$transaction(async (tx) => {
      for (const batchId of uniqueIds) {
        await deleteBatchCascade(tx, batchId, user.id)
      }
    })

    revalidatePath("/import/history")
    uniqueIds.forEach((id) => {
      revalidatePath(`/import/history/${id}`)
    })
    revalidatePath("/transactions")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete import batches:", error)
    return { success: false, error: "Failed to delete import batches" }
  }
}

const deleteBatchCascade = async (tx: Prisma.TransactionClient, batchId: string, userId: string) => {
  const rows = await tx.importRow.findMany({
    where: { batchId },
    select: { transactionId: true },
  })

  const transactionIds = rows
    .map((row) => row.transactionId)
    .filter((id): id is string => !!id)

  if (transactionIds.length > 0) {
    await tx.transaction.deleteMany({
      where: {
        id: { in: transactionIds },
        userId,
      },
    })
  }

  await tx.transactionMatch.deleteMany({ where: { batchId } })
  await tx.importRow.deleteMany({ where: { batchId } })
  await tx.importBatch.delete({ where: { id: batchId } })
}
