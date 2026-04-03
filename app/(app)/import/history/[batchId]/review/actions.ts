"use server"

import { getCurrentUser } from "@/lib/auth"
import { approveMatch, rejectMatch, getTransactionMatchById, undoMatch } from "@/models/transaction-matches"
import { mergeTransaction } from "@/lib/matching/merger"
import { getTransactionById } from "@/models/transactions"
import { logCsvMerge, logMatchReview } from "@/lib/audit-logger"
import { revalidatePath } from "next/cache"

export type ActionState<T = null> = {
  success: boolean
  error?: string
  data?: T
} | null

/**
 * Approve a flagged match and merge the transaction
 */
export async function approveMatchAction(
  _prevState: ActionState<{ matchId: string }> | null,
  formData: FormData
): Promise<ActionState<{ matchId: string }>> {
  try {
    const user = await getCurrentUser()
    const matchId = formData.get("matchId") as string
    const batchId = formData.get("batchId") as string

    if (!matchId || !batchId) {
      return { success: false, error: "Missing match ID or batch ID" }
    }

    // Get the match details
    const match = await getTransactionMatchById(matchId)
    if (!match) {
      return { success: false, error: "Match not found" }
    }

    // Get the transaction
    const transaction = await getTransactionById(match.transactionId, user.id)
    if (!transaction) {
      return { success: false, error: "Transaction not found" }
    }

    // Parse CSV data to get the fields to merge
    const csvData = match.csvData as Record<string, unknown>

    // Perform the merge
    const { mergedFields } = await mergeTransaction(
      transaction,
      csvData as any
    )

    // Mark the match as approved
    await approveMatch(matchId, user.id, mergedFields)

    // Log the CSV merge and match review
    await logCsvMerge(transaction.id, user.id, mergedFields, matchId, match.batch.filename)
    await logMatchReview(transaction.id, user.id, matchId, "approved", match.batch.filename)

    // Revalidate paths
    revalidatePath(`/import/history/${batchId}`)
    revalidatePath(`/import/history/${batchId}/review`)
    revalidatePath(`/transactions/${transaction.id}`)

    return {
      success: true,
      data: { matchId },
    }
  } catch (error) {
    console.error("Error approving match:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve match",
    }
  }
}

/**
 * Reject a flagged match (don't merge)
 */
export async function rejectMatchAction(
  _prevState: ActionState<{ matchId: string }> | null,
  formData: FormData
): Promise<ActionState<{ matchId: string }>> {
  try {
    const user = await getCurrentUser()
    const matchId = formData.get("matchId") as string
    const batchId = formData.get("batchId") as string

    if (!matchId || !batchId) {
      return { success: false, error: "Missing match ID or batch ID" }
    }

    // Get the match details
    const match = await getTransactionMatchById(matchId)
    if (!match) {
      return { success: false, error: "Match not found" }
    }

    // Mark the match as rejected
    await rejectMatch(matchId, user.id)

    // Log the match review
    await logMatchReview(match.transactionId, user.id, matchId, "rejected", match.batch.filename)

    // Revalidate paths
    revalidatePath(`/import/history/${batchId}`)
    revalidatePath(`/import/history/${batchId}/review`)

    return {
      success: true,
      data: { matchId },
    }
  } catch (error) {
    console.error("Error rejecting match:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject match",
    }
  }
}

/**
 * Approve all flagged matches in a batch
 */
export async function approveAllMatchesAction(
  _prevState: ActionState<{ count: number }> | null,
  formData: FormData
): Promise<ActionState<{ count: number }>> {
  try {
    const user = await getCurrentUser()
    const batchId = formData.get("batchId") as string
    const matchIds = JSON.parse(formData.get("matchIds") as string) as string[]

    if (!batchId || !matchIds || matchIds.length === 0) {
      return { success: false, error: "Missing batch ID or match IDs" }
    }

    let approvedCount = 0

    for (const matchId of matchIds) {
      const match = await getTransactionMatchById(matchId)
      if (!match) continue

      const transaction = await getTransactionById(match.transactionId, user.id)
      if (!transaction) continue

      const csvData = match.csvData as Record<string, unknown>
      const { mergedFields } = await mergeTransaction(transaction, csvData as any)

      await approveMatch(matchId, user.id, mergedFields)

      // Log the CSV merge and match review
      await logCsvMerge(transaction.id, user.id, mergedFields, matchId, match.batch.filename)
      await logMatchReview(transaction.id, user.id, matchId, "approved", match.batch.filename)

      approvedCount++
    }

    // Revalidate paths
    revalidatePath(`/import/history/${batchId}`)
    revalidatePath(`/import/history/${batchId}/review`)

    return {
      success: true,
      data: { count: approvedCount },
    }
  } catch (error) {
    console.error("Error approving all matches:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve all matches",
    }
  }
}

/**
 * Reject all flagged matches in a batch
 */
export async function rejectAllMatchesAction(
  _prevState: ActionState<{ count: number }> | null,
  formData: FormData
): Promise<ActionState<{ count: number }>> {
  try {
    const user = await getCurrentUser()
    const batchId = formData.get("batchId") as string
    const matchIds = JSON.parse(formData.get("matchIds") as string) as string[]

    if (!batchId || !matchIds || matchIds.length === 0) {
      return { success: false, error: "Missing batch ID or match IDs" }
    }

    let rejectedCount = 0

    for (const matchId of matchIds) {
      const match = await getTransactionMatchById(matchId)
      if (!match) continue

      await rejectMatch(matchId, user.id)

      // Log the match review
      await logMatchReview(match.transactionId, user.id, matchId, "rejected", match.batch.filename)

      rejectedCount++
    }

    // Revalidate paths
    revalidatePath(`/import/history/${batchId}`)
    revalidatePath(`/import/history/${batchId}/review`)

    return {
      success: true,
      data: { count: rejectedCount },
    }
  } catch (error) {
    console.error("Error rejecting all matches:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject all matches",
    }
  }
}

/**
 * Undo an auto-merged or reviewed match
 * Marks the match as undone so it can be reviewed again
 */
export async function undoMatchAction(
  _prevState: ActionState<{ matchId: string }> | null,
  formData: FormData
): Promise<ActionState<{ matchId: string }>> {
  try {
    const user = await getCurrentUser()
    const matchId = formData.get("matchId") as string
    const batchId = formData.get("batchId") as string

    if (!matchId || !batchId) {
      return { success: false, error: "Missing match ID or batch ID" }
    }

    // Get the match details
    const match = await getTransactionMatchById(matchId)
    if (!match) {
      return { success: false, error: "Match not found" }
    }

    // Check that the match is in a state that can be undone
    if (match.status !== "auto_merged" && match.status !== "reviewed_merged") {
      return {
        success: false,
        error: `Cannot undo match with status: ${match.status}. Only auto-merged or reviewed matches can be undone.`
      }
    }

    // Mark the match as undone
    await undoMatch(matchId, user.id)

    // Log the undo action
    await logMatchReview(match.transactionId, user.id, matchId, "undone", match.batch.filename)

    // Revalidate paths
    revalidatePath(`/import/history/${batchId}`)
    revalidatePath(`/import/history/${batchId}/review`)
    revalidatePath(`/transactions/${match.transactionId}`)

    return {
      success: true,
      data: { matchId },
    }
  } catch (error) {
    console.error("Error undoing match:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to undo match",
    }
  }
}
