"use server"

// File-like interface for form data uploads (avoids runtime File check issues in Node.js)
interface UploadedFile {
  name: string
  size: number
  type: string
  lastModified: number
  arrayBuffer(): Promise<ArrayBuffer>
}

import { ActionState } from "@/lib/actions"
import { getCurrentUser, isSubscriptionExpired } from "@/lib/auth"
import {
  getDirectorySize,
  getUserUploadsDirectory,
  isEnoughStorageToUploadFile,
  safePathJoin,
  unsortedFilePath,
} from "@/lib/files"
import { createFile } from "@/models/files"
import { updateUser } from "@/models/users"
import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"
import path from "path"

export async function uploadFilesAction(formData: FormData): Promise<ActionState<null>> {
  const user = await getCurrentUser()
  const files = formData.getAll("files") as UploadedFile[]

  // Make sure upload dir exists
  const userUploadsDirectory = getUserUploadsDirectory(user)

  // Check limits
  const totalFileSize = files.reduce((acc, file) => acc + (file?.size || 0), 0)
  if (!isEnoughStorageToUploadFile(user, totalFileSize)) {
    return { success: false, error: `Insufficient storage to upload these files` }
  }

  if (isSubscriptionExpired(user)) {
    return {
      success: false,
      error: "Your subscription has expired, please upgrade your account or buy new subscription plan",
    }
  }

  // Process each file
  const uploadedFiles = await Promise.all(
    files.map(async (file) => {
      if (!file || typeof file !== "object" || !("size" in file) || !("arrayBuffer" in file)) {
        return { success: false, error: "Invalid file" }
      }

      // Save file to filesystem
      const fileUuid = randomUUID()
      const relativeFilePath = unsortedFilePath(fileUuid, file.name)
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
        metadata: {
          size: file.size,
          lastModified: file.lastModified,
        },
      })

      return fileRecord
    })
  )

  const storageUsed = await getDirectorySize(getUserUploadsDirectory(user))
  await updateUser(user.id, { storageUsed })

  console.log("uploadedFiles", uploadedFiles)

  revalidatePath("/unsorted")

  return { success: true, error: null }
}
