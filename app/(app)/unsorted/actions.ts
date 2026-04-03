"use server"

import { AnalysisResult, analyzeTransaction } from "@/ai/analyze"
import { AnalyzeAttachment, loadAttachmentsForAI } from "@/ai/attachments"
import { buildLLMPrompt } from "@/ai/prompt"
import { fieldsToJsonSchema } from "@/ai/schema"
import { transactionFormSchema } from "@/forms/transactions"
import { ActionState } from "@/lib/actions"
import { getCurrentUser, isAiBalanceExhausted, isSubscriptionExpired } from "@/lib/auth"
import {
  getDirectorySize,
  getTransactionFileUploadPath,
  getUserUploadsDirectory,
  safePathJoin,
  unsortedFilePath,
} from "@/lib/files"
import { logTransactionCreation } from "@/lib/audit-logger"
import { findPotentialMatches, MatchCandidate } from "@/lib/matching/finder"
import { mergeTransaction as mergeTransactionData } from "@/lib/matching/merger"
import { DEFAULT_PROMPT_ANALYSE_NEW_FILE } from "@/models/defaults"
import { createFile, deleteFile, getFileById, updateFile } from "@/models/files"
import { createImportBatch } from "@/models/import-batches"
import { createTransactionMatch } from "@/models/transaction-matches"
import { createTransaction, getTransactionById, TransactionData, updateTransactionFiles } from "@/models/transactions"
import { updateUser } from "@/models/users"
import { Category, Field, File, Project, Transaction } from "@/prisma/client"
import { differenceInDays } from "date-fns"
import { randomUUID } from "crypto"
import { mkdir, readFile, rename, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"
import path from "path"

export async function analyzeFileAction(
  file: File,
  settings: Record<string, string>,
  fields: Field[],
  categories: Category[],
  projects: Project[]
): Promise<ActionState<AnalysisResult>> {
  const user = await getCurrentUser()

  if (!file || file.userId !== user.id) {
    return { success: false, error: "File not found or does not belong to the user" }
  }

  if (isAiBalanceExhausted(user)) {
    return {
      success: false,
      error: "You used all of your pre-paid AI scans, please upgrade your account or buy new subscription plan",
    }
  }

  if (isSubscriptionExpired(user)) {
    return {
      success: false,
      error: "Your subscription has expired, please upgrade your account or buy new subscription plan",
    }
  }

  let attachments: AnalyzeAttachment[] = []
  try {
    attachments = await loadAttachmentsForAI(user, file)
  } catch (error) {
    console.error("Failed to retrieve files:", error)
    return { success: false, error: "Failed to retrieve files: " + error }
  }

  const prompt = buildLLMPrompt(
    settings.prompt_analyse_new_file || DEFAULT_PROMPT_ANALYSE_NEW_FILE,
    fields,
    categories,
    projects
  )

  const schema = fieldsToJsonSchema(fields)

  const results = await analyzeTransaction(prompt, schema, attachments, file.id, user.id)

  console.log("Analysis results:", results)

  if (results.data?.tokensUsed && results.data.tokensUsed > 0) {
    await updateUser(user.id, { aiBalance: { decrement: 1 } })
  }

  // After successful AI analysis, check for potential matches
  if (results.success && results.data && results.data.output) {
    const extractedData = results.data.output

    // Extract amount and date for matching (LLM returns cents directly)
    const amount = extractedData.total ? Math.round(parseFloat(extractedData.total as string)) : null
    const date = extractedData.issuedAt ? new Date(extractedData.issuedAt as string) : null

    if (amount !== null && date !== null) {
      try {
        // Find potential matches using existing matching logic
        const matches = await findPotentialMatches(user.id, {
          total: amount,
          issuedAt: date,
          importReference: (extractedData.importReference as string) || null,
        })

        // Filter to confidence >= 70% and take top 3
        const validMatches = matches
          .filter(m => m.confidence >= 70)
          .slice(0, 3)

        if (validMatches.length > 0) {
          console.log(`Found ${validMatches.length} potential matches for file ${file.id}`)

          // Create ImportBatch for tracking
          const batch = await createImportBatch(user.id, {
            filename: file.filename,
            status: 'processing',
            totalRows: 1,
            metadata: {
              source: 'unsorted_file_analysis',
              fileId: file.id,
              aiAnalysisCompleted: new Date().toISOString(),
              matchCount: validMatches.length,
            }
          })

          // Return matches with analysis results
          return {
            success: true,
            data: {
              output: extractedData,
              tokensUsed: results.data.tokensUsed,
              matchData: {
                batchId: batch.id,
                matches: validMatches.map(m => ({
                  transactionId: m.transaction.id,
                  confidence: m.confidence,
                  transaction: m.transaction,
                }))
              }
            } as any // Extended AnalysisResult with matchData
          }
        }
      } catch (error) {
        console.error('Error finding matches:', error)
        // Continue without matches if matching fails
      }
    }
  }

  return results
}

export async function saveFileAsTransactionAction(
  _prevState: ActionState<Transaction> | null,
  formData: FormData
): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    const validatedForm = transactionFormSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedForm.success) {
      return { success: false, error: validatedForm.error.message }
    }

    // Get the file record
    const fileId = formData.get("fileId") as string
    const file = await getFileById(fileId, user.id)
    if (!file) throw new Error("File not found")

    // Create transaction
    const transaction = await createTransaction(user.id, validatedForm.data)

    // Log transaction creation
    try {
      await logTransactionCreation(transaction.id, user.id)
    } catch (auditError) {
      console.error("Failed to log transaction creation:", auditError)
    }

    // Move file to processed location
    const userUploadsDirectory = getUserUploadsDirectory(user)
    const originalFileName = path.basename(file.path)
    const newRelativeFilePath = getTransactionFileUploadPath(file.id, originalFileName, transaction)

    // Move file to new location and name
    const oldFullFilePath = safePathJoin(userUploadsDirectory, file.path)
    const newFullFilePath = safePathJoin(userUploadsDirectory, newRelativeFilePath)
    await mkdir(path.dirname(newFullFilePath), { recursive: true })
    await rename(path.resolve(oldFullFilePath), path.resolve(newFullFilePath))

    // Update file record
    await updateFile(file.id, user.id, {
      path: newRelativeFilePath,
      isReviewed: true,
    })

    await updateTransactionFiles(transaction.id, user.id, [file.id])

    revalidatePath("/unsorted")
    revalidatePath("/transactions")

    return { success: true, data: transaction }
  } catch (error) {
    console.error("Failed to save transaction:", error)
    return { success: false, error: `Failed to save transaction: ${error}` }
  }
}

export async function mergeWithExistingTransactionAction(
  _prevState: ActionState<{ transactionId: string }> | null,
  formData: FormData
): Promise<ActionState<{ transactionId: string }>> {
  try {
    const user = await getCurrentUser()

    // Parse form data
    const fileId = formData.get('fileId') as string
    const transactionId = formData.get('transactionId') as string
    const batchId = formData.get('batchId') as string
    const confidence = parseInt(formData.get('confidence') as string)
    const mergeData = JSON.parse(formData.get('mergeData') as string)

    console.log('[Merge] Starting merge:', { fileId, transactionId, batchId, confidence })

    // Validate user owns file and transaction
    const file = await getFileById(fileId, user.id)
    const transaction = await getTransactionById(transactionId, user.id)

    if (!file) {
      return { success: false, error: 'File not found or does not belong to you' }
    }

    if (!transaction) {
      return { success: false, error: 'Transaction not found or does not belong to you' }
    }

    // Merge transaction using existing merge logic
    console.log('[Merge] Merging transaction data...')
    const mergeResult = await mergeTransactionData(
      transaction,
      {
        ...mergeData,
        receiptFileId: file.id, // Attach file to transaction
        // LLM returns cents directly, no conversion needed
        total: mergeData.total ? Math.round(mergeData.total) : transaction.total,
      }
    )

    console.log('[Merge] Transaction merged, creating match record...')

    // Calculate days difference
    const matchedDate = mergeData.issuedAt ? new Date(mergeData.issuedAt) : new Date()
    const existingDate = transaction.issuedAt || new Date()
    const daysDifference = Math.abs(differenceInDays(matchedDate, existingDate))

    // Create TransactionMatch record
    await createTransactionMatch({
      batchId,
      transactionId,
      confidence,
      matchedAmount: mergeData.total ? Math.round(mergeData.total) : transaction.total || 0,
      matchedDate,
      existingDate,
      daysDifference,
      status: 'reviewed_merged',
      csvData: mergeData,
      mergedFields: mergeResult.mergedFields,
      reviewedBy: user.id,
      reviewedAt: new Date(),
    })

    console.log('[Merge] Match record created, moving file...')

    // Move file to organized location (same logic as saveFileAsTransactionAction)
    const userUploadsDirectory = getUserUploadsDirectory(user)
    const originalFileName = path.basename(file.path)
    const newRelativeFilePath = getTransactionFileUploadPath(file.id, originalFileName, transaction)

    const oldFullFilePath = safePathJoin(userUploadsDirectory, file.path)
    const newFullFilePath = safePathJoin(userUploadsDirectory, newRelativeFilePath)

    // Create directories and move file
    await mkdir(path.dirname(newFullFilePath), { recursive: true })
    await rename(path.resolve(oldFullFilePath), path.resolve(newFullFilePath))

    // Update file record
    await updateFile(file.id, user.id, {
      path: newRelativeFilePath,
      isReviewed: true,
    })

    console.log('[Merge] File moved, updating transaction files...')

    // Explicitly ensure file is attached to transaction
    // Get the updated transaction to get current files
    const updatedTransaction = await getTransactionById(transactionId, user.id)
    if (updatedTransaction) {
      const existingFiles = Array.isArray(updatedTransaction.files)
        ? (updatedTransaction.files as string[])
        : []

      // Add the file if not already attached
      if (!existingFiles.includes(file.id)) {
        await updateTransactionFiles(transactionId, user.id, [...existingFiles, file.id])
        console.log('[Merge] File attached to transaction')
      } else {
        console.log('[Merge] File already attached to transaction')
      }
    }

    // Update ImportBatch status (mark as completed)
    await updateUser(user.id, {}) // Touch user to update timestamp
    // Note: We don't have updateImportBatch with just ID, need to pass userId
    // The batch will remain in 'processing' status which is okay for single-file batches

    // Revalidate paths
    revalidatePath('/unsorted')
    revalidatePath('/transactions')
    revalidatePath(`/transactions/${transactionId}`)

    console.log('[Merge] Merge complete!')

    return {
      success: true,
      data: { transactionId },
    }
  } catch (error) {
    console.error('[Merge] Error merging with existing transaction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to merge transaction',
    }
  }
}

export async function deleteUnsortedFileAction(
  _prevState: ActionState<Transaction> | null,
  fileId: string
): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    await deleteFile(fileId, user.id)
    revalidatePath("/unsorted")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete file:", error)
    return { success: false, error: "Failed to delete file" }
  }
}

export async function splitFileIntoItemsAction(
  _prevState: ActionState<null> | null,
  formData: FormData
): Promise<ActionState<null>> {
  try {
    const user = await getCurrentUser()
    const fileId = formData.get("fileId") as string
    const items = JSON.parse(formData.get("items") as string) as TransactionData[]

    if (!fileId || !items || items.length === 0) {
      return { success: false, error: "File ID and items are required" }
    }

    // Get the original file
    const originalFile = await getFileById(fileId, user.id)
    if (!originalFile) {
      return { success: false, error: "Original file not found" }
    }

    // Get the original file's content
    const userUploadsDirectory = getUserUploadsDirectory(user)
    const originalFilePath = safePathJoin(userUploadsDirectory, originalFile.path)
    const fileContent = await readFile(originalFilePath)

    // Create a new file for each item
    for (const item of items) {
      const fileUuid = randomUUID()
      const fileName = `${originalFile.filename}-part-${item.name}`
      const relativeFilePath = unsortedFilePath(fileUuid, fileName)
      const fullFilePath = safePathJoin(userUploadsDirectory, relativeFilePath)

      // Create directory if it doesn't exist
      await mkdir(path.dirname(fullFilePath), { recursive: true })

      // Copy the original file content
      await writeFile(fullFilePath, fileContent)

      // Create file record in database with the item data cached
      await createFile(user.id, {
        id: fileUuid,
        filename: fileName,
        path: relativeFilePath,
        mimetype: originalFile.mimetype,
        metadata: originalFile.metadata,
        isSplitted: true,
        cachedParseResult: {
          name: item.name,
          merchant: item.merchant,
          description: item.description,
          total: item.total,
          currencyCode: item.currencyCode,
          categoryCode: item.categoryCode,
          projectCode: item.projectCode,
          type: item.type,
          issuedAt: item.issuedAt,
          note: item.note,
          text: item.text,
        },
      })
    }

    // Delete the original file
    await deleteFile(fileId, user.id)

    // Update user storage used
    const storageUsed = await getDirectorySize(getUserUploadsDirectory(user))
    await updateUser(user.id, { storageUsed })

    revalidatePath("/unsorted")
    return { success: true }
  } catch (error) {
    console.error("Failed to split file into items:", error)
    return { success: false, error: `Failed to split file into items: ${error}` }
  }
}
