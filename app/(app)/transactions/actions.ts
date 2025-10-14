"use server"

import { transactionFormSchema } from "@/forms/transactions"
import { ActionState } from "@/lib/actions"
import { getCurrentUser, isSubscriptionExpired } from "@/lib/auth"
import {
  getDirectorySize,
  getTransactionFileUploadPath,
  getUserUploadsDirectory,
  isEnoughStorageToUploadFile,
  safePathJoin,
} from "@/lib/files"
import { updateField } from "@/models/fields"
import { createFile, deleteFile, getFilesByTransactionId } from "@/models/files"
import {
  bulkDeleteTransactions,
  createTransaction,
  deleteTransaction,
  getTransactionById,
  updateTransaction,
  updateTransactionFiles,
  TransactionData,
} from "@/models/transactions"
import { updateUser } from "@/models/users"
import { Transaction } from "@/prisma/client"
import { randomUUID } from "crypto"
import { copyFile, mkdir, readFile, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"
import path from "path"

export async function createTransactionAction(
  _prevState: ActionState<Transaction> | null,
  formData: FormData
): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    const validatedForm = transactionFormSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedForm.success) {
      return { success: false, error: validatedForm.error.message }
    }

    const transaction = await createTransaction(user.id, validatedForm.data)

    revalidatePath("/transactions")
    return { success: true, data: transaction }
  } catch (error) {
    console.error("Failed to create transaction:", error)
    return { success: false, error: "Failed to create transaction" }
  }
}

export async function saveTransactionAction(
  _prevState: ActionState<Transaction> | null,
  formData: FormData
): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    const transactionId = formData.get("transactionId") as string
    const validatedForm = transactionFormSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedForm.success) {
      return { success: false, error: validatedForm.error.message }
    }

    const transaction = await updateTransaction(transactionId, user.id, validatedForm.data)

    revalidatePath("/transactions")
    return { success: true, data: transaction }
  } catch (error) {
    console.error("Failed to update transaction:", error)
    return { success: false, error: "Failed to save transaction" }
  }
}

export async function deleteTransactionAction(
  _prevState: ActionState<Transaction> | null,
  transactionId: string
): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    const transaction = await getTransactionById(transactionId, user.id)
    if (!transaction) throw new Error("Transaction not found")

    await deleteTransaction(transaction.id, user.id)

    revalidatePath("/transactions")

    return { success: true, data: transaction }
  } catch (error) {
    console.error("Failed to delete transaction:", error)
    return { success: false, error: "Failed to delete transaction" }
  }
}

export async function deleteTransactionFileAction(
  transactionId: string,
  fileId: string
): Promise<ActionState<Transaction>> {
  if (!fileId || !transactionId) {
    return { success: false, error: "File ID and transaction ID are required" }
  }

  const user = await getCurrentUser()
  const transaction = await getTransactionById(transactionId, user.id)
  if (!transaction) {
    return { success: false, error: "Transaction not found" }
  }

  await updateTransactionFiles(
    transactionId,
    user.id,
    transaction.files ? (transaction.files as string[]).filter((id) => id !== fileId) : []
  )

  await deleteFile(fileId, user.id)

  // Update user storage used
  const storageUsed = await getDirectorySize(getUserUploadsDirectory(user))
  await updateUser(user.id, { storageUsed })

  revalidatePath(`/transactions/${transactionId}`)
  return { success: true, data: transaction }
}

export async function uploadTransactionFilesAction(formData: FormData): Promise<ActionState<Transaction>> {
  try {
    const transactionId = formData.get("transactionId") as string
    const files = formData.getAll("files") as File[]

    if (!files || !transactionId) {
      return { success: false, error: "No files or transaction ID provided" }
    }

    const user = await getCurrentUser()
    const transaction = await getTransactionById(transactionId, user.id)
    if (!transaction) {
      return { success: false, error: "Transaction not found" }
    }

    const userUploadsDirectory = getUserUploadsDirectory(user)

    // Check limits
    const totalFileSize = files.reduce((acc, file) => acc + file.size, 0)
    if (!isEnoughStorageToUploadFile(user, totalFileSize)) {
      return { success: false, error: `Insufficient storage to upload new files` }
    }

    if (isSubscriptionExpired(user)) {
      return {
        success: false,
        error: "Your subscription has expired, please upgrade your account or buy new subscription plan",
      }
    }

    const fileRecords = await Promise.all(
      files.map(async (file) => {
        const fileUuid = randomUUID()
        const relativeFilePath = getTransactionFileUploadPath(fileUuid, file.name, transaction)
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const fullFilePath = safePathJoin(userUploadsDirectory, relativeFilePath)
        await mkdir(path.dirname(fullFilePath), { recursive: true })

        await writeFile(fullFilePath, buffer)

        // Create file record in database
        const fileRecord = await createFile(user.id, {
          id: fileUuid,
          filename: file.name,
          path: relativeFilePath,
          mimetype: file.type,
          isReviewed: true,
          metadata: {
            size: file.size,
            lastModified: file.lastModified,
          },
        })

        return fileRecord
      })
    )

    // Update invoice with the new file ID
    await updateTransactionFiles(
      transactionId,
      user.id,
      transaction.files
        ? [...(transaction.files as string[]), ...fileRecords.map((file) => file.id)]
        : fileRecords.map((file) => file.id)
    )

    // Update user storage used
    const storageUsed = await getDirectorySize(getUserUploadsDirectory(user))
    await updateUser(user.id, { storageUsed })

    revalidatePath(`/transactions/${transactionId}`)
    return { success: true }
  } catch (error) {
    console.error("Upload error:", error)
    return { success: false, error: `File upload failed: ${error}` }
  }
}

export async function bulkDeleteTransactionsAction(transactionIds: string[]) {
  try {
    const user = await getCurrentUser()
    await bulkDeleteTransactions(transactionIds, user.id)
    revalidatePath("/transactions")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete transactions:", error)
    return { success: false, error: "Failed to delete transactions" }
  }
}

export async function duplicateTransactionAction(transactionId: string): Promise<ActionState<Transaction>> {
  try {
    const user = await getCurrentUser()
    const originalTransaction = await getTransactionById(transactionId, user.id)
    
    if (!originalTransaction) {
      return { success: false, error: "Transaction not found" }
    }

    // Get all files attached to the original transaction
    const originalFiles = await getFilesByTransactionId(transactionId, user.id)
    const userUploadsDirectory = getUserUploadsDirectory(user)

    // Create a new transaction with the same data (without id and timestamps)
    const newTransaction = await createTransaction(user.id, {
      name: originalTransaction.name,
      description: originalTransaction.description,
      merchant: originalTransaction.merchant,
      total: originalTransaction.total,
      currencyCode: originalTransaction.currencyCode,
      convertedTotal: originalTransaction.convertedTotal,
      convertedCurrencyCode: originalTransaction.convertedCurrencyCode,
      type: originalTransaction.type,
      categoryCode: originalTransaction.categoryCode,
      projectCode: originalTransaction.projectCode,
      issuedAt: originalTransaction.issuedAt,
      note: originalTransaction.note,
      items: originalTransaction.items as TransactionData[] | undefined,
      extra: originalTransaction.extra as Record<string, unknown>,
      text: originalTransaction.text,
    }, { skipExtraSplit: true })

    // Clone all files
    const newFileIds: string[] = []
    for (const originalFile of originalFiles) {
      try {
        const newFileUuid = randomUUID()
        const originalFilePath = safePathJoin(userUploadsDirectory, originalFile.path)
        const newRelativeFilePath = getTransactionFileUploadPath(newFileUuid, originalFile.filename, newTransaction)
        const newFullFilePath = safePathJoin(userUploadsDirectory, newRelativeFilePath)

        // Ensure directory exists
        await mkdir(path.dirname(newFullFilePath), { recursive: true })

        // Copy the physical file
        await copyFile(originalFilePath, newFullFilePath)

        // Create new file record in database
        const newFileRecord = await createFile(user.id, {
          id: newFileUuid,
          filename: originalFile.filename,
          path: newRelativeFilePath,
          mimetype: originalFile.mimetype,
          isReviewed: true,
          metadata: originalFile.metadata,
        })

        newFileIds.push(newFileRecord.id)
      } catch (fileError) {
        console.error("Failed to clone file:", originalFile.filename, fileError)
        // Continue with other files even if one fails
      }
    }

    // Link cloned files to the new transaction
    if (newFileIds.length > 0) {
      await updateTransactionFiles(newTransaction.id, user.id, newFileIds)
    }

    // Update user storage used
    const storageUsed = await getDirectorySize(getUserUploadsDirectory(user))
    await updateUser(user.id, { storageUsed })

    revalidatePath("/transactions")
    
    return { success: true, data: newTransaction }
  } catch (error) {
    console.error("Failed to duplicate transaction:", error)
    return { success: false, error: "Failed to duplicate transaction" }
  }
}

export async function updateFieldVisibilityAction(fieldCode: string, isVisible: boolean) {
  try {
    const user = await getCurrentUser()
    await updateField(user.id, fieldCode, {
      isVisibleInList: isVisible,
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to update field visibility:", error)
    return { success: false, error: "Failed to update field visibility" }
  }
}
