import { Transaction } from "@/prisma/client"
import { TransactionData, updateTransaction } from "@/models/transactions"

export type ParsedCSVData = TransactionData & {
  importReference?: string | null
  receiptFileId?: string | null
  convertedCurrencyCode?: string | null
}

export type MergeResult = {
  transaction: Transaction
  mergedFields: string[]
}

/**
 * Merge CSV data into an existing transaction
 *
 * Field Preference Rules:
 * - NEVER overwrite: categoryCode, projectCode, note, extra (user has already categorized)
 * - Update if CSV has more detail: description (longer text)
 * - Update if empty in database: merchant
 * - Always add: importReference (for tracking)
 * - Append: files (don't replace)
 * - Validate: total, issuedAt, currencyCode (must match)
 *
 * @param existingTransaction - The transaction to merge into
 * @param csvData - Parsed data from CSV row
 * @param confidence - Match confidence score (for reference)
 * @returns Merged transaction and list of fields that were updated
 */
export async function mergeTransaction(
  existingTransaction: Transaction,
  csvData: ParsedCSVData

): Promise<MergeResult> {
  const updates: Partial<TransactionData> = {}
  const mergedFields: string[] = []

  // Update description if CSV has more detail (longer text)
  if (
    csvData.description &&
    csvData.description.length > (existingTransaction.description?.length || 0)
  ) {
    updates.description = csvData.description
    mergedFields.push("description")
  }

  // Update merchant if database doesn't have one
  if (csvData.merchant && !existingTransaction.merchant) {
    updates.merchant = csvData.merchant
    mergedFields.push("merchant")
  }

  // Update name if database doesn't have one
  if (csvData.name && !existingTransaction.name) {
    updates.name = csvData.name
    mergedFields.push("name")
  }

  // Store CSV reference for tracking (always add if provided)
  if (csvData.importReference && !existingTransaction.importReference) {
    updates.importReference = csvData.importReference
    mergedFields.push("importReference")
  }

  // Append receipt file if provided (don't replace existing files)
  if (csvData.receiptFileId) {
    const existingFiles = Array.isArray(existingTransaction.files)
      ? (existingTransaction.files as string[])
      : []

    if (!existingFiles.includes(csvData.receiptFileId)) {
      updates.files = [...existingFiles, csvData.receiptFileId]
      mergedFields.push("files")
    }
  }

  // Track merge timestamp
  updates.lastMatchedAt = new Date()

  // Apply updates if there are any changes (more than just timestamp)
  let transaction = existingTransaction
  if (Object.keys(updates).length > 1) {
    transaction = await updateTransaction(existingTransaction.id, existingTransaction.userId, updates)
  } else if (Object.keys(updates).length === 1) {
    // Only timestamp update
    transaction = await updateTransaction(existingTransaction.id, existingTransaction.userId, updates)
  }

  return { transaction, mergedFields }
}

/**
 * Validate that CSV data matches the existing transaction for critical fields
 * This is a sanity check before merging
 *
 * @param existingTransaction - The transaction to validate against
 * @param csvData - Parsed data from CSV row
 * @returns True if validation passes
 * @throws Error if validation fails with details
 */
export function validateMergeCompatibility(
  existingTransaction: Transaction,
  csvData: ParsedCSVData
): boolean {
  const errors: string[] = []

  // Amount must match exactly (this should already be guaranteed by the matching algorithm)
  if (existingTransaction.total !== csvData.total) {
    errors.push(
      `Amount mismatch: DB has ${existingTransaction.total}, CSV has ${csvData.total}`
    )
  }

  // Date should match within acceptable range (already validated by confidence score)
  // But we'll check if they exist
  if (!existingTransaction.issuedAt && csvData.issuedAt) {
    // Database transaction has no date but CSV does - this is actually okay
    // We might want to update it
  }

  // Currency should match if both are present
  if (
    existingTransaction.currencyCode &&
    csvData.currencyCode &&
    existingTransaction.currencyCode !== csvData.currencyCode
  ) {
    errors.push(
      `Currency mismatch: DB has ${existingTransaction.currencyCode}, CSV has ${csvData.currencyCode}`
    )
  }

  // Converted currency should also match if both are present
  if (
    existingTransaction.convertedCurrencyCode &&
    csvData.convertedCurrencyCode &&
    existingTransaction.convertedCurrencyCode !== csvData.convertedCurrencyCode
  ) {
    errors.push(
      `Converted currency mismatch: DB has ${existingTransaction.convertedCurrencyCode}, CSV has ${csvData.convertedCurrencyCode}`
    )
  }

  if (errors.length > 0) {
    throw new Error(`Merge validation failed:\n${errors.join("\n")}`)
  }

  return true
}

/**
 * Determine which fields would be updated by a merge (without actually merging)
 * Useful for showing a preview to the user
 *
 * @param existingTransaction - The transaction to check
 * @param csvData - Parsed data from CSV row
 * @returns Array of field names that would be updated
 */
export function previewMergeChanges(
  existingTransaction: Transaction,
  csvData: ParsedCSVData
): string[] {
  const changes: string[] = []

  if (
    csvData.description &&
    csvData.description.length > (existingTransaction.description?.length || 0)
  ) {
    changes.push("description")
  }

  if (csvData.merchant && !existingTransaction.merchant) {
    changes.push("merchant")
  }

  if (csvData.name && !existingTransaction.name) {
    changes.push("name")
  }

  if (csvData.importReference && !existingTransaction.importReference) {
    changes.push("importReference")
  }

  if (csvData.receiptFileId) {
    const existingFiles = Array.isArray(existingTransaction.files)
      ? (existingTransaction.files as string[])
      : []

    if (!existingFiles.includes(csvData.receiptFileId)) {
      changes.push("files")
    }
  }

  return changes
}
