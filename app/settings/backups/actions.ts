"use server"

import { prisma } from "@/lib/db"
import { FILE_UPLOAD_PATH } from "@/lib/files"
import { MODEL_BACKUP } from "@/models/backups"
import fs from "fs"
import { mkdir } from "fs/promises"
import JSZip from "jszip"
import path from "path"

const SUPPORTED_BACKUP_VERSIONS = ["1.0"]

export async function restoreBackupAction(prevState: any, formData: FormData) {
  const file = formData.get("file") as File
  const removeExistingData = formData.get("removeExistingData") === "true"

  if (!file) {
    return { success: false, error: "No file provided" }
  }

  // Restore tables
  try {
    const fileBuffer = await file.arrayBuffer()
    const fileData = Buffer.from(fileBuffer)
    const zip = await JSZip.loadAsync(fileData)

    // Check backup version
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

    if (removeExistingData) {
      await clearAllTables()
    }

    for (const { filename, model, idField } of MODEL_BACKUP) {
      try {
        const jsonFile = zip.file(`data/${filename}`)
        if (jsonFile) {
          const jsonContent = await jsonFile.async("string")
          const restoredCount = await restoreModelFromJSON(model, jsonContent, idField)
          console.log(`Restored ${restoredCount} records from ${filename}`)
        }
      } catch (error) {
        console.error(`Error restoring model from ${filename}:`, error)
      }
    }

    // Restore files
    try {
      const filesToRestore = Object.keys(zip.files).filter(
        (filename) => filename.startsWith("data/uploads/") && !filename.endsWith("/")
      )

      if (filesToRestore.length > 0) {
        await mkdir(FILE_UPLOAD_PATH, { recursive: true })

        // Extract and save each file
        let restoredFilesCount = 0
        for (const zipFilePath of filesToRestore) {
          const file = zip.file(zipFilePath)
          if (file) {
            const relativeFilePath = zipFilePath.replace("data/uploads/", "")
            const fileContent = await file.async("nodebuffer")

            const filePath = path.join(FILE_UPLOAD_PATH, relativeFilePath)
            const fileName = path.basename(filePath)
            const fileId = path.basename(fileName, path.extname(fileName))
            const fileDir = path.dirname(filePath)
            await mkdir(fileDir, { recursive: true })

            // Write the file
            fs.writeFileSync(filePath, fileContent)
            restoredFilesCount++

            // Update the file record
            await prisma.file.upsert({
              where: { id: fileId },
              update: {
                path: filePath,
              },
              create: {
                id: relativeFilePath,
                path: filePath,
                filename: fileName,
                mimetype: "application/octet-stream",
              },
            })
          }
        }
      }
    } catch (error) {
      console.error("Error restoring uploaded files:", error)
      return {
        success: false,
        error: `Error restoring uploaded files: ${error instanceof Error ? error.message : String(error)}`,
      }
    }

    return { success: true, message: `Restore completed successfully` }
  } catch (error) {
    console.error("Error restoring from backup:", error)
    return {
      success: false,
      error: `Error restoring from backup: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

async function clearAllTables() {
  // Delete in reverse order to handle foreign key constraints
  for (const { model } of [...MODEL_BACKUP].reverse()) {
    try {
      await model.deleteMany({})
    } catch (error) {
      console.error(`Error clearing table:`, error)
    }
  }
}

async function restoreModelFromJSON(model: any, jsonContent: string, idField: string): Promise<number> {
  if (!jsonContent) return 0

  try {
    const records = JSON.parse(jsonContent)

    if (!records || records.length === 0) {
      return 0
    }

    let insertedCount = 0
    for (const rawRecord of records) {
      const record = processRowData(rawRecord)

      try {
        // Skip records that don't have the required ID field
        if (record[idField] === undefined) {
          console.warn(`Skipping record missing required ID field '${idField}'`)
          continue
        }

        await model.upsert({
          where: { [idField]: record[idField] },
          update: record,
          create: record,
        })
        insertedCount++
      } catch (error) {
        console.error(`Error upserting record:`, error)
      }
    }

    return insertedCount
  } catch (error) {
    console.error(`Error parsing JSON content:`, error)
    return 0
  }
}

function processRowData(row: Record<string, any>): Record<string, any> {
  const processedRow: Record<string, any> = {}

  for (const [key, value] of Object.entries(row)) {
    if (value === "" || value === "null" || value === undefined) {
      processedRow[key] = null
      continue
    }

    // Try to parse JSON for object fields
    if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
      try {
        processedRow[key] = JSON.parse(value)
        continue
      } catch (e) {
        // Not valid JSON, continue with normal processing
      }
    }

    // Handle dates (checking for ISO date format)
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value)) {
      processedRow[key] = new Date(value)
      continue
    }

    // Handle numbers
    if (typeof value === "string" && !isNaN(Number(value)) && key !== "id" && !key.endsWith("Code")) {
      // Convert numbers but preserving string IDs
      processedRow[key] = Number(value)
      continue
    }

    // Default: keep as is
    processedRow[key] = value
  }

  return processedRow
}
