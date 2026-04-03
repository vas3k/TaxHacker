import { prisma } from "@/lib/db"
import { Transaction } from "@/prisma/client"
import { addDays, subDays } from "date-fns"
import { calculateMatchConfidence } from "./algorithm"

export type MatchCandidate = {
  transaction: Transaction
  confidence: number
}

export type CSVTransactionData = {
  total?: number | null // in cents
  issuedAt?: Date | null
  importReference?: string | null
}

/**
 * Find potential matching transactions in the database for a CSV row
 *
 * Strategy:
 * 1. First try exact reference match (if CSV has Reference field)
 * 2. Otherwise search for exact amount + date within ±3 days
 * 3. Calculate confidence for each candidate
 * 4. Return sorted by confidence (highest first)
 *
 * @param userId - User ID to scope the search
 * @param csvData - Parsed CSV transaction data
 * @returns Array of matching candidates sorted by confidence
 */
export async function findPotentialMatches(
  userId: string,
  csvData: CSVTransactionData
): Promise<MatchCandidate[]> {
  // Strategy 1: Try exact reference match first (100% confidence)
  if (csvData.importReference) {
    const exactMatch = await prisma.transaction.findFirst({
      where: {
        userId,
        importReference: csvData.importReference,
      },
      include: {
        category: true,
        project: true,
      },
    })

    if (exactMatch) {
      return [
        {
          transaction: exactMatch,
          confidence: 100, // Exact reference match is always 100%
        },
      ]
    }
  }

  // If we don't have the required fields for amount/date matching, stop here
  if (csvData.total == null || !csvData.issuedAt) {
    return []
  }

  // Strategy 2: Find candidates by exact amount + date range (±3 days)
  const dateFrom = subDays(csvData.issuedAt, 3)
  const dateTo = addDays(csvData.issuedAt, 3)

  const candidates = await prisma.transaction.findMany({
    where: {
      userId,
      total: csvData.total,
      issuedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    include: {
      category: true,
      project: true,
    },
  })

  // No candidates found
  if (candidates.length === 0) {
    return []
  }

  // Calculate confidence for each candidate
  const { total, issuedAt } = csvData
  const matches: MatchCandidate[] = candidates
    .map((transaction) => {
      const confidence = calculateMatchConfidence(
        total,
        issuedAt,
        transaction.total!,
        transaction.issuedAt!
      )

      return {
        transaction,
        confidence,
      }
    })
    .filter((match) => match.confidence > 0) // Only keep valid matches

  // Sort by confidence (highest first)
  // If tied, prefer most recent transaction (createdAt DESC)
  matches.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence
    }
    // Tiebreaker: most recent transaction
    return b.transaction.createdAt.getTime() - a.transaction.createdAt.getTime()
  })

  return matches
}

/**
 * Find the best match for a CSV transaction
 * Returns the highest confidence match, or null if no matches found
 *
 * @param userId - User ID to scope the search
 * @param csvData - Parsed CSV transaction data
 * @returns Best matching candidate or null
 */
export async function findBestMatch(
  userId: string,
  csvData: CSVTransactionData
): Promise<MatchCandidate | null> {
  const matches = await findPotentialMatches(userId, csvData)
  return matches.length > 0 ? matches[0] : null
}

/**
 * Check if a transaction has already been matched in a specific import batch
 * This prevents duplicate matching within the same import
 *
 * @param transactionId - Transaction ID to check
 * @param batchId - Import batch ID
 * @returns True if already matched in this batch
 */
export async function isAlreadyMatchedInBatch(
  transactionId: string,
  batchId: string
): Promise<boolean> {
  const existing = await prisma.transactionMatch.findFirst({
    where: {
      transactionId,
      batchId,
    },
  })

  return existing !== null
}
