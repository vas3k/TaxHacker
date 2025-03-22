"use server"

import { transactionFormSchema } from "@/forms/transactions"
import { getTransactionFileUploadPath } from "@/lib/files"
import { deleteFile, getFileById, updateFile } from "@/models/files"
import { createTransaction, updateTransactionFiles } from "@/models/transactions"
import { mkdir, rename } from "fs/promises"
import { revalidatePath } from "next/cache"
import path from "path"

export async function saveFileAsTransactionAction(prevState: any, formData: FormData) {
  try {
    const validatedForm = transactionFormSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedForm.success) {
      return { success: false, error: validatedForm.error.message }
    }

    // Get the file record
    const fileId = formData.get("fileId") as string
    const file = await getFileById(fileId)
    if (!file) throw new Error("File not found")

    // Create transaction
    const transaction = await createTransaction(validatedForm.data)

    // Move file to processed location
    const originalFileName = path.basename(file.path)
    const { fileUuid, filePath: newFilePath } = await getTransactionFileUploadPath(originalFileName, transaction)

    // Move file to new location and name
    await mkdir(path.dirname(newFilePath), { recursive: true })
    await rename(path.resolve(file.path), path.resolve(newFilePath))

    // Update file record
    await updateFile(file.id, {
      id: fileUuid,
      path: newFilePath,
      isReviewed: true,
    })

    await updateTransactionFiles(transaction.id, [fileUuid])

    revalidatePath("/unsorted")
    revalidatePath("/transactions")

    return { success: true, transactionId: transaction.id }
  } catch (error) {
    console.error("Failed to save transaction:", error)
    return { success: false, error: `Failed to save transaction: ${error}` }
  }
}

export async function deleteUnsortedFileAction(prevState: any, fileId: string) {
  try {
    await deleteFile(fileId)
    revalidatePath("/unsorted")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete file:", error)
    return { success: false, error: "Failed to delete file" }
  }
}
