import { Transaction } from "@/prisma/client"
import { TransactionData } from "@/models/transactions"
import { createAuditLogs, AuditLogData } from "@/models/transaction-audit-logs"

/**
 * Fields that should not trigger audit logs (system fields)
 */
const EXCLUDED_FIELDS = ["id", "userId", "createdAt", "updatedAt"]

/**
 * Compare two values for equality, handling dates, arrays, and objects
 */
function areValuesEqual(oldValue: any, newValue: any): boolean {
  // Handle null/undefined
  if (oldValue === null || oldValue === undefined) {
    return newValue === null || newValue === undefined
  }
  if (newValue === null || newValue === undefined) {
    return false
  }

  // Handle dates
  if (oldValue instanceof Date && newValue instanceof Date) {
    return oldValue.getTime() === newValue.getTime()
  }
  if (oldValue instanceof Date || newValue instanceof Date) {
    // One is a date, the other isn't - try to compare as ISO strings
    const oldStr = oldValue instanceof Date ? oldValue.toISOString() : String(oldValue)
    const newStr = newValue instanceof Date ? newValue.toISOString() : String(newValue)
    return oldStr === newStr
  }

  // Handle arrays
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (oldValue.length !== newValue.length) return false
    return JSON.stringify(oldValue) === JSON.stringify(newValue)
  }

  // Handle objects
  if (typeof oldValue === "object" && typeof newValue === "object") {
    return JSON.stringify(oldValue) === JSON.stringify(newValue)
  }

  // Handle primitives
  return oldValue === newValue
}

/**
 * Serialize a value for storage in audit log
 */
function serializeValue(value: any): any {
  if (value === null || value === undefined) {
    return null
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === "object") {
    return value
  }
  return value
}

/**
 * Log manual edits to a transaction by comparing old and new data
 */
export async function logManualEdit(
  transactionId: string,
  userId: string,
  oldTransaction: Transaction,
  newData: TransactionData
): Promise<void> {
  const logs: AuditLogData[] = []

  // Standard fields to check
  const fieldsToCheck: (keyof Transaction)[] = [
    "name",
    "description",
    "merchant",
    "total",
    "currencyCode",
    "convertedTotal",
    "convertedCurrencyCode",
    "type",
    "note",
    "categoryCode",
    "projectCode",
    "issuedAt",
    "text",
  ]

  // Check each standard field
  for (const field of fieldsToCheck) {
    if (EXCLUDED_FIELDS.includes(field)) continue

    const oldValue = oldTransaction[field]
    const newValue = newData[field as keyof TransactionData]

    // Skip if values are equal
    if (areValuesEqual(oldValue, newValue)) continue

    logs.push({
      transactionId,
      userId,
      action: "manual_edit",
      fieldName: field,
      oldValue: serializeValue(oldValue),
      newValue: serializeValue(newValue),
    })
  }

  // Check JSON fields (items, files)
  if (!areValuesEqual(oldTransaction.items, newData.items)) {
    logs.push({
      transactionId,
      userId,
      action: "manual_edit",
      fieldName: "items",
      oldValue: serializeValue(oldTransaction.items),
      newValue: serializeValue(newData.items),
    })
  }

  if (!areValuesEqual(oldTransaction.files, newData.files)) {
    logs.push({
      transactionId,
      userId,
      action: "manual_edit",
      fieldName: "files",
      oldValue: serializeValue(oldTransaction.files),
      newValue: serializeValue(newData.files),
    })
  }

  // Check extra fields (handle individual fields within extra)
  const oldExtra = (oldTransaction.extra as Record<string, unknown>) || {}
  const newExtra = (newData.extra as Record<string, unknown>) || {}

  // Get all extra field keys
  const extraKeys = new Set([...Object.keys(oldExtra), ...Object.keys(newExtra)])

  for (const key of extraKeys) {
    const oldValue = oldExtra[key]
    const newValue = newExtra[key]

    if (!areValuesEqual(oldValue, newValue)) {
      logs.push({
        transactionId,
        userId,
        action: "manual_edit",
        fieldName: `extra.${key}`,
        oldValue: serializeValue(oldValue),
        newValue: serializeValue(newValue),
      })
    }
  }

  // Create all audit logs in batch
  if (logs.length > 0) {
    await createAuditLogs(logs)
  }
}

/**
 * Log transaction creation
 */
export async function logTransactionCreation(
  transactionId: string,
  userId: string,
  metadata?: {
    batchId?: string
    batchFilename?: string
    format?: string
    source?: "manual" | "csv_import" | "file_analysis"
  }
): Promise<void> {
  await createAuditLogs([
    {
      transactionId,
      userId,
      action: "created",
      metadata: metadata || { source: "manual" },
    },
  ])
}

/**
 * Log CSV merge operation
 */
export async function logCsvMerge(
  transactionId: string,
  userId: string,
  mergedFields: string[],
  matchId: string,
  batchFilename: string
): Promise<void> {
  const logs: AuditLogData[] = mergedFields.map((fieldName) => ({
    transactionId,
    userId,
    action: "csv_merge",
    fieldName,
    metadata: {
      matchId,
      batchFilename,
    },
  }))

  if (logs.length > 0) {
    await createAuditLogs(logs)
  }
}

/**
 * Log match review (approval or rejection)
 */
export async function logMatchReview(
  transactionId: string,
  userId: string,
  matchId: string,
  status: string,
  batchFilename: string
): Promise<void> {
  await createAuditLogs([
    {
      transactionId,
      userId,
      action: "match_reviewed",
      metadata: {
        matchId,
        status,
        batchFilename,
      },
    },
  ])
}
