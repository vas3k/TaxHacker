"use server"

import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { getUserUploadsDirectory, unsortedFilePath } from "@/lib/files"
import { getPaperlessClientForUser } from "@/lib/paperless/settings"
import { PaperlessCorrespondent, PaperlessDocument, PaperlessPaginatedResponse, PaperlessTag } from "@/lib/paperless/types"
import { createFile, getFileByPaperlessDocumentId } from "@/models/files"
import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"
import path from "path"

interface FetchResult {
  documents: PaperlessPaginatedResponse<PaperlessDocument>
  tags: PaperlessTag[]
  correspondents: PaperlessCorrespondent[]
}

export async function fetchPaperlessDocumentsAction(
  _prevState: ActionState<FetchResult> | null,
  formData: FormData
): Promise<ActionState<FetchResult>> {
  const user = await getCurrentUser()
  const paperless = await getPaperlessClientForUser(user.id)

  if (!paperless) {
    return { success: false, error: "Paperless-ngx is not configured" }
  }

  try {
    const page = Number(formData.get("page")) || 1
    const query = (formData.get("query") as string) || undefined
    const tagFilter = formData.get("tag") ? Number(formData.get("tag")) : undefined

    const [documents, tags, correspondents] = await Promise.all([
      paperless.client.listDocuments({
        page,
        page_size: 25,
        query,
        tags__id__in: tagFilter ? [tagFilter] : undefined,
        ordering: "-created",
      }),
      paperless.client.listTags(),
      paperless.client.listCorrespondents(),
    ])

    return { success: true, data: { documents, tags, correspondents } }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to fetch documents from Paperless-ngx" }
  }
}

interface ImportResult {
  imported: number
  skipped: number
  failed: number
  errors: string[]
}

export async function importPaperlessDocumentsAction(
  _prevState: ActionState<ImportResult> | null,
  formData: FormData
): Promise<ActionState<ImportResult>> {
  const user = await getCurrentUser()
  const paperless = await getPaperlessClientForUser(user.id)

  if (!paperless) {
    return { success: false, error: "Paperless-ngx is not configured" }
  }

  const documentIds: number[] = JSON.parse(formData.get("documentIds") as string)
  if (!documentIds || documentIds.length === 0) {
    return { success: false, error: "No documents selected" }
  }

  const result: ImportResult = { imported: 0, skipped: 0, failed: 0, errors: [] }
  const userUploadsDir = getUserUploadsDirectory(user)

  for (const docId of documentIds) {
    try {
      const existing = await getFileByPaperlessDocumentId(user.id, docId)
      if (existing) {
        result.skipped++
        continue
      }

      const docMeta = await paperless.client.getDocument(docId)
      const { buffer, contentType, filename } = await paperless.client.downloadDocument(docId)

      const fileUuid = randomUUID()
      const originalFilename = docMeta.original_file_name || filename || `paperless-${docId}.pdf`
      const relPath = unsortedFilePath(fileUuid, originalFilename)
      const fullPath = path.join(userUploadsDir, relPath)

      await mkdir(path.dirname(fullPath), { recursive: true })
      await writeFile(fullPath, buffer)

      const mimeType = contentType || guessMimeType(originalFilename)

      await createFile(user.id, {
        id: fileUuid,
        filename: originalFilename,
        path: relPath,
        mimetype: mimeType,
        metadata: {
          paperless: {
            documentId: docId,
            title: docMeta.title,
            correspondent: docMeta.correspondent,
            tags: docMeta.tags,
            createdDate: docMeta.created_date,
            content: docMeta.content?.substring(0, 2000),
          },
        },
        paperlessDocumentId: docId,
      })

      result.imported++
    } catch (error) {
      result.failed++
      result.errors.push(`Document ${docId}: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  revalidatePath("/unsorted")
  return { success: true, data: result }
}

function guessMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".gif": "image/gif",
  }
  return mimeTypes[ext] || "application/octet-stream"
}
