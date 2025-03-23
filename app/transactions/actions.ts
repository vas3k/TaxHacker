"use server"

import { transactionFormSchema } from "@/forms/transactions"
import { FILE_UPLOAD_PATH, getTransactionFileUploadPath } from "@/lib/files"
import { updateField } from "@/models/fields"
import { createFile, deleteFile } from "@/models/files"
import {
  bulkDeleteTransactions,
  createTransaction,
  deleteTransaction,
  getTransactionById,
  updateTransaction,
  updateTransactionFiles,
} from "@/models/transactions"
import { existsSync } from "fs"
import { mkdir, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"

export async function createTransactionAction(prevState: any, formData: FormData) {
  try {
    const validatedForm = transactionFormSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedForm.success) {
      return { success: false, error: validatedForm.error.message }
    }

    const transaction = await createTransaction(validatedForm.data)

    revalidatePath("/transactions")
    return { success: true, transactionId: transaction.id }
  } catch (error) {
    console.error("Failed to create transaction:", error)
    return { success: false, error: "Failed to create transaction" }
  }
}

export async function saveTransactionAction(prevState: any, formData: FormData) {
  try {
    const transactionId = formData.get("transactionId") as string
    const validatedForm = transactionFormSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedForm.success) {
      return { success: false, error: validatedForm.error.message }
    }

    const transaction = await updateTransaction(transactionId, validatedForm.data)

    revalidatePath("/transactions")
    return { success: true, transactionId: transaction.id }
  } catch (error) {
    console.error("Failed to update transaction:", error)
    return { success: false, error: "Failed to save transaction" }
  }
}

export async function deleteTransactionAction(prevState: any, transactionId: string) {
  try {
    const transaction = await getTransactionById(transactionId)
    if (!transaction) throw new Error("Transaction not found")

    await deleteTransaction(transaction.id)

    revalidatePath("/transactions")

    return { success: true, transactionId: transaction.id }
  } catch (error) {
    console.error("Failed to delete transaction:", error)
    return { success: false, error: "Failed to delete transaction" }
  }
}

export async function deleteTransactionFileAction(
  transactionId: string,
  fileId: string
): Promise<{ success: boolean; error?: string }> {
  if (!fileId || !transactionId) {
    return { success: false, error: "File ID and transaction ID are required" }
  }

  const transaction = await getTransactionById(transactionId)
  if (!transaction) {
    return { success: false, error: "Transaction not found" }
  }

  await updateTransactionFiles(
    transactionId,
    transaction.files ? (transaction.files as string[]).filter((id) => id !== fileId) : []
  )

  await deleteFile(fileId)
  revalidatePath(`/transactions/${transactionId}`)
  return { success: true }
}

export async function uploadTransactionFilesAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const transactionId = formData.get("transactionId") as string
    const files = formData.getAll("files") as File[]

    if (!files || !transactionId) {
      return { success: false, error: "No files or transaction ID provided" }
    }

    const transaction = await getTransactionById(transactionId)
    if (!transaction) {
      return { success: false, error: "Transaction not found" }
    }

    // Make sure upload dir exists
    if (!existsSync(FILE_UPLOAD_PATH)) {
      await mkdir(FILE_UPLOAD_PATH, { recursive: true })
    }

    const fileRecords = await Promise.all(
      files.map(async (file) => {
        const { fileUuid, filePath } = await getTransactionFileUploadPath(file.name, transaction)
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await writeFile(filePath, buffer)

        // Create file record in database
        const fileRecord = await createFile({
          id: fileUuid,
          filename: file.name,
          path: filePath,
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
      transaction.files
        ? [...(transaction.files as string[]), ...fileRecords.map((file) => file.id)]
        : fileRecords.map((file) => file.id)
    )

    revalidatePath(`/transactions/${transactionId}`)
    return { success: true }
  } catch (error) {
    console.error("Upload error:", error)
    return { success: false, error: `File upload failed: ${error}` }
  }
}

export async function bulkDeleteTransactionsAction(transactionIds: string[]) {
  try {
    await bulkDeleteTransactions(transactionIds)
    revalidatePath("/transactions")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete transactions:", error)
    return { success: false, error: "Failed to delete transactions" }
  }
}

export async function updateFieldVisibilityAction(fieldCode: string, isVisible: boolean) {
  try {
    await updateField(fieldCode, {
      isVisibleInList: isVisible,
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to update field visibility:", error)
    return { success: false, error: "Failed to update field visibility" }
  }
}
