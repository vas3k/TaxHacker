"use server"

import { getCurrentUser } from "@/lib/auth"
import { getUserUploadsDirectory, unsortedFilePath } from "@/lib/files"
import { createFile } from "@/models/files"
import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"
import path from "path"

export async function uploadFilesAction(prevState: any, formData: FormData) {
  const user = await getCurrentUser()
  const files = formData.getAll("files")

  // Make sure upload dir exists
  const userUploadsDirectory = await getUserUploadsDirectory(user)

  // Process each file
  const uploadedFiles = await Promise.all(
    files.map(async (file) => {
      if (!(file instanceof File)) {
        return { success: false, error: "Invalid file" }
      }

      // Save file to filesystem
      const fileUuid = randomUUID()
      const relativeFilePath = await unsortedFilePath(fileUuid, file.name)
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const fullFilePath = path.join(userUploadsDirectory, relativeFilePath)
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

  console.log("uploadedFiles", uploadedFiles)

  revalidatePath("/unsorted")

  return { success: true, error: null }
}
