import { differenceInDays } from "date-fns"

/**
 * Calculate match confidence score between a CSV transaction and a database transaction
 *
 * Scoring System:
 * - Exact amount match: 60 points (required baseline)
 * - Date proximity: 0-40 points based on variance:
 *   - Same day: +40 points → 100% confidence
 *   - ±1 day: +30 points → 90% confidence (auto-merge threshold)
 *   - ±2 days: +20 points → 80% confidence (flag for review)
 *   - ±3 days: +10 points → 70% confidence (flag for review)
 *   - >±3 days: No match (0%)
 *
 * @param csvAmount - Amount from CSV in cents
 * @param csvDate - Transaction date from CSV
 * @param dbAmount - Amount from database in cents
 * @param dbDate - Transaction date from database
 * @returns Confidence score from 0-100, or 0 if no match
 */
export function calculateMatchConfidence(
  csvAmount: number,
  csvDate: Date,
  dbAmount: number,
  dbDate: Date
): number {
  // Exact amount required - this is our baseline
  if (csvAmount !== dbAmount) return 0

  let confidence = 60 // Base score for exact amount match

  // Calculate date difference in days
  const daysDiff = Math.abs(differenceInDays(csvDate, dbDate))

  // Score based on date proximity
  if (daysDiff === 0) {
    confidence += 40 // Same day = 100% total
  } else if (daysDiff === 1) {
    confidence += 30 // ±1 day = 90% total (auto-merge threshold)
  } else if (daysDiff === 2) {
    confidence += 20 // ±2 days = 80% total
  } else if (daysDiff === 3) {
    confidence += 10 // ±3 days = 70% total
  } else {
    return 0 // Outside acceptable range, no match
  }

  return confidence
}

/**
 * Normalize amount for comparison
 * Handles negative values (AmEx format) and ensures integer comparison
 *
 * @param amount - Amount value (can be negative)
 * @returns Absolute value as integer (in cents)
 */
export function normalizeAmount(amount: number): number {
  return Math.abs(Math.round(amount))
}

/**
 * Check if a confidence score meets the auto-merge threshold
 *
 * @param confidence - Confidence score (0-100)
 * @returns True if should auto-merge (≥90%)
 */
export function shouldAutoMerge(confidence: number): boolean {
  return confidence >= 90
}

/**
 * Check if a confidence score should be flagged for manual review
 *
 * @param confidence - Confidence score (0-100)
 * @returns True if should be flagged (<90% but >0%)
 */
export function shouldFlagForReview(confidence: number): boolean {
  return confidence > 0 && confidence < 90
}
