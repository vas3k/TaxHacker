import { File, Transaction, User } from "@prisma/client"
import { access, constants, readdir, stat } from "fs/promises"
import path from "path"

export const FILE_UPLOAD_PATH = path.resolve(process.env.UPLOAD_PATH || "./uploads")
export const FILE_UNSORTED_DIRECTORY_NAME = "unsorted"
export const FILE_PREVIEWS_DIRECTORY_NAME = "previews"
export const FILE_IMPORT_CSV_DIRECTORY_NAME = "csv"

export async function getUserUploadsDirectory(user: User) {
  return path.join(FILE_UPLOAD_PATH, user.email)
}

export async function getUserPreviewsDirectory(user: User) {
  return path.join(FILE_UPLOAD_PATH, user.email, FILE_PREVIEWS_DIRECTORY_NAME)
}

export async function unsortedFilePath(fileUuid: string, filename: string): Promise<string> {
  const fileExtension = path.extname(filename)
  return path.join(FILE_UNSORTED_DIRECTORY_NAME, `${fileUuid}${fileExtension}`)
}

export async function previewFilePath(fileUuid: string, page: number): Promise<string> {
  return path.join(FILE_PREVIEWS_DIRECTORY_NAME, `${fileUuid}.${page}.webp`)
}

export async function getTransactionFileUploadPath(fileUuid: string, filename: string, transaction: Transaction) {
  const fileExtension = path.extname(filename)
  const storedFileName = `${fileUuid}${fileExtension}`
  return formatFilePath(storedFileName, transaction.issuedAt || new Date())
}

export async function fullPathForFile(user: User, file: File) {
  const userUploadsDirectory = await getUserUploadsDirectory(user)
  return path.join(userUploadsDirectory, path.normalize(file.path))
}

function formatFilePath(filename: string, date: Date, format = "{YYYY}/{MM}/{name}{ext}") {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const ext = path.extname(filename)
  const name = path.basename(filename, ext)

  return format.replace("{YYYY}", String(year)).replace("{MM}", month).replace("{name}", name).replace("{ext}", ext)
}

export async function fileExists(filePath: string) {
  try {
    await access(path.normalize(filePath), constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function getDirectorySize(directoryPath: string) {
  let totalSize = 0
  async function calculateSize(dir: string) {
    const files = await readdir(dir, { withFileTypes: true })
    for (const file of files) {
      const fullPath = path.join(dir, file.name)
      if (file.isDirectory()) {
        await calculateSize(fullPath)
      } else if (file.isFile()) {
        const stats = await stat(fullPath)
        totalSize += stats.size
      }
    }
  }
  await calculateSize(directoryPath)
  return totalSize
}
