import { fileExists, fullPathForFile } from "@/lib/files"
import { resolvePreviewFormat } from "@/lib/previews/format"
import { generateFilePreviews } from "@/lib/previews/generate"
import { getSettings } from "@/models/settings"
import { File, User } from "@/prisma/client"
import fs from "fs/promises"

const MAX_PAGES_TO_ANALYZE = 4

export type AnalyzeAttachment = {
  filename: string
  contentType: string
  base64: string
}

export const loadAttachmentsForAI = async (user: User, file: File): Promise<AnalyzeAttachment[]> => {
  const fullFilePath = fullPathForFile(user, file)
  const isFileExists = await fileExists(fullFilePath)
  if (!isFileExists) {
    throw new Error("File not found on disk")
  }

  const settings = await getSettings(user.id)
  const format = resolvePreviewFormat(settings.llm_attachment_format)
  const { contentType, previews } = await generateFilePreviews(user, fullFilePath, file.mimetype, format)

  return Promise.all(
    previews.slice(0, MAX_PAGES_TO_ANALYZE).map(async (preview) => ({
      filename: file.filename,
      contentType: contentType,
      base64: await loadFileAsBase64(preview),
    }))
  )
}

export const loadFileAsBase64 = async (filePath: string): Promise<string> => {
  const buffer = await fs.readFile(filePath)
  return Buffer.from(buffer).toString("base64")
}
