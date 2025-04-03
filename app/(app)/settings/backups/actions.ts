"use server"

import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getUserUploadsDirectory } from "@/lib/files"
import { MODEL_BACKUP, modelFromJSON } from "@/models/backups"
import fs from "fs/promises"
import JSZip from "jszip"
import path from "path"

const SUPPORTED_BACKUP_VERSIONS = ["1.0"]
const REMOVE_EXISTING_DATA = true

export async function restoreBackupAction(prevState: any, formData: FormData) {
  const user = await getCurrentUser()
  const userUploadsDirectory = await getUserUploadsDirectory(user)
  const file = formData.get("file") as File

  if (!file || file.size === 0) {
    return { success: false, error: "No file provided" }
  }

  // Read zip archive
  let zip: JSZip
  try {
    const fileBuffer = await file.arrayBuffer()
    const fileData = Buffer.from(fileBuffer)
    zip = await JSZip.loadAsync(fileData)
  } catch (error) {
    return { success: false, error: "Bad zip archive" }
  }

  if (REMOVE_EXISTING_DATA) {
    await cleanupUserTables(user.id)
    await fs.rm(userUploadsDirectory, { recursive: true, force: true })
  }

  // Check metadata and start restoring
  try {
    const metadataFile = zip.file("data/metadata.json")
    if (metadataFile) {
      const metadataContent = await metadataFile.async("string")
      try {
        const metadata = JSON.parse(metadataContent)
        if (!metadata.version || !SUPPORTED_BACKUP_VERSIONS.includes(metadata.version)) {
          return {
            success: false,
            error: `Incompatible backup version: ${
              metadata.version || "unknown"
            }. Supported versions: ${SUPPORTED_BACKUP_VERSIONS.join(", ")}`,
          }
        }
        console.log(`Restoring backup version ${metadata.version} created at ${metadata.timestamp}`)
      } catch (error) {
        console.warn("Could not parse backup metadata:", error)
      }
    } else {
      console.warn("No metadata found in backup, assuming legacy format")
    }

    const counters: Record<string, number> = {}

    // Restore tables
    for (const backup of MODEL_BACKUP) {
      try {
        const jsonFile = zip.file(`data/${backup.filename}`)
        if (jsonFile) {
          const jsonContent = await jsonFile.async("string")
          const restoredCount = await modelFromJSON(user.id, backup, jsonContent)
          console.log(`Restored ${restoredCount} records from ${backup.filename}`)
          counters[backup.filename] = restoredCount
        }
      } catch (error) {
        console.error(`Error restoring model from ${backup.filename}:`, error)
      }
    }

    // Restore files
    try {
      let restoredFilesCount = 0
      const files = await prisma.file.findMany({
        where: {
          userId: user.id,
        },
      })

      const userUploadsDirectory = await getUserUploadsDirectory(user)

      for (const file of files) {
        const filePathWithoutPrefix = file.path.replace(/^.*\/uploads\//, "")
        const zipFilePath = path.join("data/uploads", filePathWithoutPrefix)
        const zipFile = zip.file(zipFilePath)
        if (!zipFile) {
          console.log(`File ${file.path} not found in backup`)
          continue
        }

        const fullFilePath = path.join(userUploadsDirectory, filePathWithoutPrefix)
        const fileContent = await zipFile.async("nodebuffer")

        try {
          await fs.mkdir(path.dirname(fullFilePath), { recursive: true })
          await fs.writeFile(fullFilePath, fileContent)
          restoredFilesCount++
        } catch (error) {
          console.error(`Error writing file ${fullFilePath}:`, error)
          continue
        }

        await prisma.file.update({
          where: { id: file.id },
          data: {
            path: filePathWithoutPrefix,
          },
        })
      }
      counters["Uploaded attachments"] = restoredFilesCount
    } catch (error) {
      console.error("Error restoring uploaded files:", error)
      return {
        success: false,
        error: `Error restoring uploaded files: ${error instanceof Error ? error.message : String(error)}`,
      }
    }

    return { success: true, message: "Restore completed successfully", counters }
  } catch (error) {
    console.error("Error restoring from backup:", error)
    return {
      success: false,
      error: `Error restoring from backup: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

async function cleanupUserTables(userId: string) {
  // Delete in reverse order to handle foreign key constraints
  for (const { model } of [...MODEL_BACKUP].reverse()) {
    try {
      await model.deleteMany({ where: { userId } })
    } catch (error) {
      console.error(`Error clearing table:`, error)
    }
  }
}
