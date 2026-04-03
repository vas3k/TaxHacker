"use server"

import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { EXPORT_AND_IMPORT_FIELD_MAP } from "@/models/export_and_import"
import { createTransaction, TransactionData } from "@/models/transactions"
import { Transaction } from "@/prisma/client"
import { parse } from "@fast-csv/parse"
import { revalidatePath } from "next/cache"
import { differenceInDays } from "date-fns"
import { findBestMatch, isAlreadyMatchedInBatch } from "@/lib/matching/finder"
import { mergeTransaction, validateMergeCompatibility } from "@/lib/matching/merger"
import { shouldAutoMerge } from "@/lib/matching/algorithm"
import { createImportBatch, updateImportBatch, incrementBatchCount, completeBatch, completeBatchWithErrors, calculateContentHash, findDuplicateBatch } from "@/models/import-batches"
import { createImportRow, markRowProcessed, markRowError, markRowSkipped } from "@/models/import-rows"
import { createTransactionMatch } from "@/models/transaction-matches"
import { updateProgress, getOrCreateProgress } from "@/models/progress"
import { detectCSVFormat, CSVFormat } from "@/lib/csv/format-detector"
import { aggregateAmazonRows, AmazonRawRow, getAggregationStats } from "@/lib/csv/amazon-aggregator"
import { mapAmazonOrderToTransaction } from "@/lib/csv/amazon-mapper"
import { mapAmexRowToTransaction } from "@/lib/csv/amex-parser"
import { mapChaseRowToTransaction } from "@/lib/csv/chase-parser"
import { ProjectMappingsInput } from "@/types/import"
import { importProject } from "@/models/export_and_import"
import { logTransactionCreation } from "@/lib/audit-logger"

export async function parseCSVAction(
  _prevState: ActionState<{ rows: string[][], format: CSVFormat, contentHash: string }> | null,
  formData: FormData
): Promise<ActionState<{ rows: string[][], format: CSVFormat, contentHash: string }>> {
  const file = formData.get("file") as File
  if (!file) {
    return { success: false, error: "No file uploaded" }
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { success: false, error: "Only CSV files are allowed" }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const content = buffer.toString('utf-8')

    // Calculate content hash for duplicate detection
    const contentHash = calculateContentHash(content)

    const rows: string[][] = []

    const parser = parse()
      .on("data", (row) => rows.push(row))
      .on("error", (error) => {
        throw error
      })
    parser.write(buffer)
    parser.end()

    // Wait for parsing to complete
    await new Promise((resolve) => parser.on("end", resolve))

    // Detect CSV format from header row
    const format = rows.length > 0 ? detectCSVFormat(rows[0]) : 'generic'

    console.log(`CSV format detected: ${format} (${rows.length} rows, hash: ${contentHash.substring(0, 8)}...)`)

    return { success: true, data: { rows, format, contentHash } }
  } catch (error) {
    console.error("Error parsing CSV:", error)
    return { success: false, error: "Failed to parse CSV file" }
  }
}

export async function saveTransactionsAction(
  _prevState: ActionState<Transaction> | null,
  formData: FormData
): Promise<ActionState<Transaction>> {
  const user = await getCurrentUser()
  try {
    const rows = JSON.parse(formData.get("rows") as string) as Record<string, unknown>[]
    const format = (formData.get("format") as CSVFormat) || "generic"
    const projectMappings = formData.get("projectMappings")
      ? (JSON.parse(formData.get("projectMappings") as string) as ProjectMappingsInput)
      : undefined
    const processed = await prepareTransactions(user.id, rows, format, projectMappings)

    for (const { data } of processed) {
      await createTransaction(user.id, data)
    }

    revalidatePath("/import/csv")
    revalidatePath("/transactions")

    return { success: true }
  } catch (error) {
    console.error("Error saving transactions:", error)
    return { success: false, error: "Failed to save transactions: " + error }
  }
}

/**
 * Import CSV with automatic duplicate detection and matching
 */
export async function saveTransactionsWithMatchingAction(
  _prevState: ActionState<{ batchId: string }> | null,
  formData: FormData
): Promise<ActionState<{ batchId: string }>> {
  const user = await getCurrentUser()

  try {
    // Get configuration
    const matchingEnabled = process.env.RECEIPT_MATCH_ENABLED !== "false"
    const autoMergeThreshold = parseInt(process.env.RECEIPT_MATCH_AUTO_MERGE_THRESHOLD || "90")

    // Parse form data
    const rows = JSON.parse(formData.get("rows") as string) as Record<string, unknown>[]
    const filename = (formData.get("filename") as string) || "upload.csv"
    const contentHash = (formData.get("contentHash") as string) || null
    const columnMappings = JSON.parse(formData.get("columnMappings") as string) as Record<
      string,
      string
    >
    const progressId = formData.get("progressId") as string
    const format = (formData.get("format") as CSVFormat) || 'generic'
    const projectMappings = formData.get("projectMappings")
      ? (JSON.parse(formData.get("projectMappings") as string) as ProjectMappingsInput)
      : undefined

    console.log(`Processing ${rows.length} rows in ${format} format`)

    // Check for duplicate CSV import
    let duplicateBatch = null
    if (contentHash) {
      duplicateBatch = await findDuplicateBatch(user.id, contentHash)
      if (duplicateBatch) {
        console.warn(`Duplicate CSV detected! Previously imported as batch ${duplicateBatch.id} on ${duplicateBatch.createdAt}`)
      }
    }

    // Process rows based on format
    const originalRowCount = rows.length
    const processedTransactions = await prepareTransactions(user.id, rows, format, projectMappings)

    console.log(`Prepared ${processedTransactions.length} transactions for import`)

    // Create import batch
    const batch = await createImportBatch(user.id, {
      filename,
      contentHash,
      totalRows: processedTransactions.length,
      metadata: {
        columnMappings: format === 'generic' ? columnMappings : {},
        format,
        originalRowCount, // Track original for audit (Amazon only)
        ...(duplicateBatch && {
          duplicateWarning: true,
          previousBatchId: duplicateBatch.id,
          previousImportDate: duplicateBatch.createdAt.toISOString(),
        }),
      },
    })

    // Initialize progress tracking
    await getOrCreateProgress(user.id, progressId, "csv_import", {
      batchId: batch.id,
      matched: 0,
      created: 0,
      flagged: 0,
      errors: 0,
    }, processedTransactions.length)

    // Process each transaction
    const CHUNK_SIZE = 100
    let matchedAccumulator = 0
    let createdAccumulator = 0
    let skippedAccumulator = 0
    let errorAccumulator = 0
    for (let i = 0; i < processedTransactions.length; i += CHUNK_SIZE) {
      const chunk = processedTransactions.slice(i, i + CHUNK_SIZE)

      for (const [index, { data: parsedData, originalRow }] of chunk.entries()) {
        const rowNumber = i + index + 1

        try {
          // Create import row record
          const importRow = await createImportRow({
            batchId: batch.id,
            rowNumber,
            rawData: originalRow,
            parsedData: parsedData as Record<string, unknown>,
          })

          const hasReference = typeof parsedData.importReference === "string" && parsedData.importReference.length > 0
          const hasAmountAndDate = Boolean(parsedData.total && parsedData.issuedAt)

          // Skip matching if disabled or missing necessary matching data
          if (!matchingEnabled || (!hasReference && !hasAmountAndDate)) {
            const transaction = await createTransaction(user.id, parsedData)
            await logTransactionCreation(transaction.id, user.id, {
              source: "csv_import",
              batchId: batch.id,
              batchFilename: batch.filename,
              format: format || undefined,
            })
            await markRowProcessed(importRow.id, transaction.id, "created")
            await incrementBatchCount(batch.id, user.id, "createdCount")
            createdAccumulator += 1
            continue
          }

          // Find potential matches
          const bestMatch = await findBestMatch(user.id, {
            total: typeof parsedData.total === "number" ? (parsedData.total as number) : undefined,
            issuedAt:
              parsedData.issuedAt instanceof Date
                ? (parsedData.issuedAt as Date)
                : parsedData.issuedAt
                  ? new Date(parsedData.issuedAt as Date | string)
                  : undefined,
            importReference:
              typeof parsedData.importReference === "string" ? parsedData.importReference : undefined,
          })

          if (bestMatch) {
            // Check if already matched in this batch (prevent duplicate matching)
            const alreadyMatched = await isAlreadyMatchedInBatch(
              bestMatch.transaction.id,
              batch.id
            )

            if (alreadyMatched) {
              await markRowSkipped(importRow.id, "Already matched in this batch")
              await incrementBatchCount(batch.id, user.id, "skippedCount")
              skippedAccumulator += 1
              continue
            }

            // Calculate days difference for audit
            const matchedDate =
              (parsedData.issuedAt instanceof Date
                ? parsedData.issuedAt
                : parsedData.issuedAt
                  ? new Date(parsedData.issuedAt as Date | string)
                  : null) ?? bestMatch.transaction.issuedAt ?? new Date()
            const existingDate = bestMatch.transaction.issuedAt ?? matchedDate
            const daysDiff = Math.abs(differenceInDays(matchedDate, existingDate))

            // Check if should auto-merge
            if (shouldAutoMerge(bestMatch.confidence) && bestMatch.confidence >= autoMergeThreshold) {
              // Auto-merge
              try {
                validateMergeCompatibility(bestMatch.transaction, parsedData)
                const { transaction, mergedFields } = await mergeTransaction(
                  bestMatch.transaction,
                  parsedData
                )

                // Record the match
                await createTransactionMatch({
                  batchId: batch.id,
                  transactionId: transaction.id,
                  confidence: bestMatch.confidence,
                  matchedAmount:
                    typeof parsedData.total === "number" ? (parsedData.total as number) : bestMatch.transaction.total!,
                  matchedDate: matchedDate,
                  existingDate: existingDate,
                  daysDifference: daysDiff,
                  status: "auto_merged",
                  csvData: originalRow,
                  mergedFields,
                })

                await markRowProcessed(importRow.id, transaction.id, "matched")
                await incrementBatchCount(batch.id, user.id, "matchedCount")
                matchedAccumulator += 1
              } catch (mergeError) {
                // If merge fails, create new instead
                console.error("Merge failed:", mergeError)
                const transaction = await createTransaction(user.id, parsedData)
                await logTransactionCreation(transaction.id, user.id, {
                  source: "csv_import",
                  batchId: batch.id,
                  batchFilename: batch.filename,
                  format: format || undefined,
                })
                await markRowError(importRow.id, `Merge failed: ${mergeError}`)
                await incrementBatchCount(batch.id, user.id, "errorCount")
                errorAccumulator += 1
              }
            } else {
              // Flag for manual review
              await createTransactionMatch({
                batchId: batch.id,
                transactionId: bestMatch.transaction.id,
                confidence: bestMatch.confidence,
                matchedAmount:
                  typeof parsedData.total === "number" ? (parsedData.total as number) : bestMatch.transaction.total!,
                matchedDate: matchedDate,
                existingDate: existingDate,
                daysDifference: daysDiff,
                status: "flagged",
                csvData: originalRow,
              })

              await markRowSkipped(
                importRow.id,
                `Flagged for review (${bestMatch.confidence}% confidence)`
              )
              await incrementBatchCount(batch.id, user.id, "skippedCount")
              skippedAccumulator += 1
            }
          } else {
            // No match found - create new transaction
            const transaction = await createTransaction(user.id, parsedData)
            await logTransactionCreation(transaction.id, user.id, {
              source: "csv_import",
              batchId: batch.id,
              batchFilename: batch.filename,
              format: format || undefined,
            })
            await markRowProcessed(importRow.id, transaction.id, "created")
            await incrementBatchCount(batch.id, user.id, "createdCount")
            createdAccumulator += 1
          }
        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error)
          await incrementBatchCount(batch.id, user.id, "errorCount")
          errorAccumulator += 1
        }
      }

      // Update progress after each chunk using accumulated counts
      await updateProgress(user.id, progressId, {
        current: Math.min(i + CHUNK_SIZE, processedTransactions.length),
        data: {
          batchId: batch.id,
          matched: matchedAccumulator,
          created: createdAccumulator,
          flagged: skippedAccumulator,
          errors: errorAccumulator,
        },
      })
    }

    // Mark batch as completed (with or without errors)
    if (errorAccumulator > 0) {
      await completeBatchWithErrors(batch.id, user.id)
    } else {
      await completeBatch(batch.id, user.id)
    }

    revalidatePath("/import/csv")
    revalidatePath("/import/history")
    revalidatePath("/transactions")

    return { success: true, data: { batchId: batch.id } }
  } catch (error) {
    console.error("Error importing with matching:", error)
    return { success: false, error: `Failed to import CSV: ${error}` }
  }
}

/**
 * Parse CSV row to transaction data with field transformations
 */
async function parseCSVRowToTransaction(
  userId: string,
  row: Record<string, unknown>
): Promise<TransactionData> {
  const transactionData: Record<string, unknown> = {}

  for (const [fieldCode, value] of Object.entries(row)) {
    const fieldDef = EXPORT_AND_IMPORT_FIELD_MAP[fieldCode]
    if (fieldDef?.import) {
      transactionData[fieldCode] = await fieldDef.import(userId, value as string)
    } else {
      transactionData[fieldCode] = value
    }
  }

  // Handle American Express negative amounts (normalize to positive)
  if (transactionData.total && typeof transactionData.total === "number") {
    transactionData.total = Math.abs(transactionData.total)
  }

  return transactionData as TransactionData
}

async function resolveProjectMappings(
  userId: string,
  input?: ProjectMappingsInput
): Promise<Record<string, string>> {
  if (!input) return {}
  const resolved: Record<string, string> = {}
  for (const [po, choice] of Object.entries(input)) {
    if (!po) continue
    if (choice.mode === "existing") {
      resolved[po] = choice.code
    } else {
      const name = choice.name?.trim() || po
      const project = await importProject(userId, name)
      resolved[po] = project.code
    }
  }
  return resolved
}

type PreparedTransaction = {
  data: TransactionData
  originalRow: Record<string, unknown>
}

async function prepareTransactions(
  userId: string,
  rows: Record<string, unknown>[],
  format: CSVFormat,
  projectMappingsInput?: ProjectMappingsInput
): Promise<PreparedTransaction[]> {
  if (format === "amazon") {
    console.log("Amazon format detected - aggregating items by order...")
    const amazonRows: AmazonRawRow[] = rows.map((row) => {
      const amazonRow: Record<string, string> = {}
      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = key.replace(/^\uFEFF/, "")
        amazonRow[normalizedKey] = String(value ?? "")
      }
      return amazonRow as AmazonRawRow
    })

    const aggregatedOrders = aggregateAmazonRows(amazonRows)
    const stats = getAggregationStats(amazonRows, aggregatedOrders)
    console.log(
      `Amazon aggregation: ${stats.totalRows} rows → ${stats.totalOrders} orders (${stats.reductionPercent}% reduction, avg ${stats.avgItemsPerOrder} items/order)`
    )
    const resolvedProjectMap = await resolveProjectMappings(userId, projectMappingsInput)

    return aggregatedOrders.map((order) => ({
      data: {
        ...mapAmazonOrderToTransaction(order),
        projectCode: order.purchaseOrderNumber ? resolvedProjectMap[order.purchaseOrderNumber] : undefined,
      },
      originalRow: {
        orderId: order.orderId,
        paymentReferenceId: order.paymentReferenceId,
        paymentAmount: (order.paymentAmount / 100).toFixed(2),
        paymentAmountCents: order.paymentAmount,
        paymentDate: order.paymentDate.toISOString(),
        purchaseOrderNumber: order.purchaseOrderNumber,
      },
    }))
  }

  if (format === "amex") {
    return Promise.all(
      rows.map(async (row) => ({
        data: await mapAmexRowToTransaction(userId, stringifyRow(row)),
        originalRow: row,
      }))
    )
  }

  if (format === "chase") {
    return Promise.all(
      rows.map(async (row) => ({
        data: await mapChaseRowToTransaction(userId, stringifyRow(row)),
        originalRow: row,
      }))
    )
  }

  return Promise.all(
    rows.map(async (row) => ({
      data: await parseCSVRowToTransaction(userId, row),
      originalRow: row,
    }))
  )
}

const stringifyRow = (row: Record<string, unknown>): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.replace(/^\uFEFF/, "")
    result[normalizedKey] = String(value ?? "")
  }
  return result
}
