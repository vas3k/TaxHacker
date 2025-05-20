"use server"

import { AnalysisResult, analyzeTransaction } from "@/ai/analyze"
import { AnalyzeAttachment, loadAttachmentsForAI } from "@/ai/attachments"
import { buildLLMPrompt } from "@/ai/prompt"
import { fieldsToJsonSchema } from "@/ai/schema"
import { transactionFormSchema } from "@/forms/transactions"
import { ActionState } from "@/lib/actions"
import { getCurrentUser, isAiBalanceExhausted, isSubscriptionExpired } from "@/lib/auth"
import config from "@/lib/config"
import { getTransactionFileUploadPath, getUserUploadsDirectory, safePathJoin } from "@/lib/files"
import { DEFAULT_PROMPT_ANALYSE_NEW_FILE } from "@/models/defaults"
import { deleteFile, getFileById, updateFile } from "@/models/files"
import { createTransaction, updateTransactionFiles } from "@/models/transactions"
import { updateUser } from "@/models/users"
import { Category, Field, File, Project, Transaction } from "@/prisma/client"
import { mkdir, rename } from "fs/promises"
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

  const apiKey = settings.openai_api_key || config.ai.openaiApiKey || ""
  if (!apiKey) {
    return { success: false, error: "OpenAI API key is not set" }
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

  const results = await analyzeTransaction(prompt, schema, attachments, apiKey, file.id, user.id)

  console.log("Analysis results:", results)

  if (results.data?.tokensUsed && results.data.tokensUsed > 0) {
    await updateUser(user.id, { aiBalance: { decrement: 1 } })
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
