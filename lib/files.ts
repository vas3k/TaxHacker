import { Transaction } from "@prisma/client"
import { randomUUID } from "crypto"
import path from "path"

export const FILE_ACCEPTED_MIMETYPES = "image/*,.pdf,.doc,.docx,.xls,.xlsx"
export const FILE_UPLOAD_PATH = path.resolve(process.env.UPLOAD_PATH || "./uploads")
export const FILE_UNSORTED_UPLOAD_PATH = path.join(FILE_UPLOAD_PATH, "unsorted")
export const FILE_PREVIEWS_PATH = path.join(FILE_UPLOAD_PATH, "previews")

export async function getUnsortedFileUploadPath(filename: string) {
  const fileUuid = randomUUID()
  const fileExtension = path.extname(filename)
  const storedFileName = `${fileUuid}${fileExtension}`
  const filePath = path.join(FILE_UNSORTED_UPLOAD_PATH, storedFileName)

  return { fileUuid, filePath }
}

export async function getTransactionFileUploadPath(filename: string, transaction: Transaction) {
  const fileUuid = randomUUID()
  const fileExtension = path.extname(filename)
  const storedFileName = `${fileUuid}${fileExtension}`
  const formattedPath = formatFilePath(storedFileName, transaction.issuedAt || new Date())
  const filePath = path.join(FILE_UPLOAD_PATH, formattedPath)

  return { fileUuid, filePath }
}

function formatFilePath(filename: string, date: Date, format = "{YYYY}/{MM}/{name}{ext}") {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const ext = path.extname(filename)
  const name = path.basename(filename, ext)

  return format.replace("{YYYY}", String(year)).replace("{MM}", month).replace("{name}", name).replace("{ext}", ext)
}
