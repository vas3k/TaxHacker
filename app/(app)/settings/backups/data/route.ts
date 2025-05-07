import { getCurrentUser } from "@/lib/auth"
import { fileExists, getUserUploadsDirectory } from "@/lib/files"
import { MODEL_BACKUP, modelToJSON } from "@/models/backups"
import fs from "fs/promises"
import JSZip from "jszip"
import { NextResponse } from "next/server"
import path from "path"

const MAX_FILE_SIZE = 64 * 1024 * 1024 // 64MB
const BACKUP_VERSION = "1.0"

export async function GET() {
  const user = await getCurrentUser()
  const userUploadsDirectory = getUserUploadsDirectory(user)

  try {
    const zip = new JSZip()
    const rootFolder = zip.folder("data")
    if (!rootFolder) {
      console.error("Failed to create zip folder")
      return new NextResponse("Internal Server Error", { status: 500 })
    }

    // Add metadata with version information
    rootFolder.file(
      "metadata.json",
      JSON.stringify(
        {
          version: BACKUP_VERSION,
          timestamp: new Date().toISOString(),
          models: MODEL_BACKUP.map((m) => m.filename),
        },
        null,
        2
      )
    )

    // Backup models
    for (const backup of MODEL_BACKUP) {
      try {
        const jsonContent = await modelToJSON(user.id, backup)
        rootFolder.file(backup.filename, jsonContent)
      } catch (error) {
        console.error(`Error exporting table ${backup.filename}:`, error)
      }
    }

    const uploadsFolder = rootFolder.folder("uploads")
    if (!uploadsFolder) {
      console.error("Failed to create uploads folder")
      return new NextResponse("Internal Server Error", { status: 500 })
    }

    const uploadedFiles = await getAllFilePaths(userUploadsDirectory)
    for (const file of uploadedFiles) {
      try {
        // Check file size before reading
        const stats = await fs.stat(file)
        if (stats.size > MAX_FILE_SIZE) {
          console.warn(
            `Skipping large file ${file} (${Math.round(stats.size / 1024 / 1024)}MB > ${
              MAX_FILE_SIZE / 1024 / 1024
            }MB limit)`
          )
          return
        }

        const fileContent = await fs.readFile(file)
        uploadsFolder.file(file.replace(userUploadsDirectory, ""), fileContent)
      } catch (error) {
        console.error(`Error reading file ${file}:`, error)
      }
    }

    const archive = await zip.generateAsync({ type: "blob" })

    return new NextResponse(archive, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="data.zip"`,
      },
    })
  } catch (error) {
    console.error("Error exporting database:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

async function getAllFilePaths(dirPath: string): Promise<string[]> {
  const filePaths: string[] = []

  async function readDirectoryRecursively(currentPath: string) {
    const isDirExists = await fileExists(currentPath)
    if (!isDirExists) {
      return
    }

    const entries = await fs.readdir(currentPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)
      if (entry.isDirectory()) {
        await readDirectoryRecursively(fullPath)
      } else {
        filePaths.push(fullPath)
      }
    }
  }

  await readDirectoryRecursively(dirPath)

  return filePaths
}
