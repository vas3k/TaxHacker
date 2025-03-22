"use server"

import { FILE_UNSORTED_UPLOAD_PATH, getUnsortedFileUploadPath } from "@/lib/files"
import { createFile } from "@/models/files"
import { existsSync } from "fs"
import { mkdir, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"

export async function uploadFilesAction(prevState: any, formData: FormData) {
  const files = formData.getAll("files")

  // Make sure upload dir exists
  if (!existsSync(FILE_UNSORTED_UPLOAD_PATH)) {
    await mkdir(FILE_UNSORTED_UPLOAD_PATH, { recursive: true })
  }

  // Process each file
  const uploadedFiles = await Promise.all(
    files.map(async (file) => {
      if (!(file instanceof File)) {
        return { success: false, error: "Invalid file" }
      }

      // Save file to filesystem
      const { fileUuid, filePath } = await getUnsortedFileUploadPath(file.name)
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      await writeFile(filePath, buffer)

      // Create file record in database
      const fileRecord = await createFile({
        id: fileUuid,
        filename: file.name,
        path: filePath,
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
