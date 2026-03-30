"use server"

import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { fullPathForFile } from "@/lib/files"
import { getPaperlessClientForUser } from "@/lib/paperless/settings"
import { PaperlessCorrespondent, PaperlessTag } from "@/lib/paperless/types"
import { getFilesByTransactionId, updateFile } from "@/models/files"
import { getTransactionById } from "@/models/transactions"
import { readFile } from "fs/promises"

interface PaperlessMetadata {
  tags: PaperlessTag[]
  correspondents: PaperlessCorrespondent[]
}

export async function fetchPaperlessMetadataAction(
  _prevState: ActionState<PaperlessMetadata> | null,
  _formData: FormData
): Promise<ActionState<PaperlessMetadata>> {
  const user = await getCurrentUser()
  const paperless = await getPaperlessClientForUser(user.id)

  if (!paperless) {
    return { success: false, error: "Paperless-ngx is not configured" }
  }

  try {
    const [tags, correspondents] = await Promise.all([
      paperless.client.listTags(),
      paperless.client.listCorrespondents(),
    ])
    return { success: true, data: { tags, correspondents } }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch Paperless metadata" }
  }
}

interface ExportResult {
  uploaded: number
  skipped: number
  failed: number
  errors: string[]
}

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 10

export async function exportToPaperlessAction(
  _prevState: ActionState<ExportResult> | null,
  formData: FormData
): Promise<ActionState<ExportResult>> {
  const user = await getCurrentUser()
  const paperless = await getPaperlessClientForUser(user.id)

  if (!paperless) {
    return { success: false, error: "Paperless-ngx is not configured" }
  }

  const transactionIds: string[] = JSON.parse(formData.get("transactionIds") as string)
  const tagIds: number[] = JSON.parse(formData.get("tagIds") as string || "[]")
  const correspondentId = formData.get("correspondentId") ? Number(formData.get("correspondentId")) : undefined

  if (!transactionIds || transactionIds.length === 0) {
    return { success: false, error: "No transactions selected" }
  }

  const result: ExportResult = { uploaded: 0, skipped: 0, failed: 0, errors: [] }

  for (const txnId of transactionIds) {
    try {
      const transaction = await getTransactionById(txnId, user.id)
      if (!transaction) {
        result.failed++
        result.errors.push(`Transaction ${txnId}: not found`)
        continue
      }

      const files = await getFilesByTransactionId(txnId, user.id)
      if (files.length === 0) {
        result.skipped++
        continue
      }

      for (const file of files) {
        if (file.paperlessDocumentId) {
          result.skipped++
          continue
        }

        try {
          const filePath = fullPathForFile(user, file)
          const buffer = await readFile(filePath)

          const taskUuid = await paperless.client.uploadDocument(buffer, file.filename, {
            title: transaction.name || file.filename,
            created: transaction.issuedAt ? transaction.issuedAt.toISOString() : undefined,
            tags: tagIds.length > 0 ? tagIds : undefined,
            correspondent: correspondentId,
          })

          let paperlessDocId: number | null = null
          for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
            try {
              const status = await paperless.client.getTaskStatus(taskUuid)
              if (status.status === "SUCCESS") {
                if (status.related_document) {
                  paperlessDocId = parseInt(status.related_document, 10)
                }
                break
              }
              if (status.status === "FAILURE") {
                throw new Error(`Upload failed: ${status.result || "unknown error"}`)
              }
            } catch (e) {
              if (attempt === MAX_POLL_ATTEMPTS - 1) throw e
            }
          }

          if (paperlessDocId) {
            await updateFile(file.id, user.id, { paperlessDocumentId: paperlessDocId })
          }

          result.uploaded++
        } catch (fileError) {
          result.failed++
          result.errors.push(
            `File ${file.filename}: ${fileError instanceof Error ? fileError.message : "Unknown error"}`
          )
        }
      }
    } catch (error) {
      result.failed++
      result.errors.push(`Transaction ${txnId}: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return { success: true, data: result }
}
