import { FILE_UPLOAD_PATH } from "@/lib/files"
import { MODEL_BACKUP } from "@/models/backups"
import fs, { readdirSync } from "fs"
import JSZip from "jszip"
import { NextResponse } from "next/server"
import path from "path"

const MAX_FILE_SIZE = 64 * 1024 * 1024 // 64MB
const BACKUP_VERSION = "1.0"

export async function GET(request: Request) {
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
    for (const { filename, model } of MODEL_BACKUP) {
      try {
        const jsonContent = await tableToJSON(model)
        rootFolder.file(filename, jsonContent)
      } catch (error) {
        console.error(`Error exporting table ${filename}:`, error)
      }
    }

    const uploadsFolder = rootFolder.folder("uploads")
    if (!uploadsFolder) {
      console.error("Failed to create uploads folder")
      return new NextResponse("Internal Server Error", { status: 500 })
    }

    const uploadedFiles = getAllFilePaths(FILE_UPLOAD_PATH)
    uploadedFiles.forEach((file) => {
      try {
        // Check file size before reading
        const stats = fs.statSync(file)
        if (stats.size > MAX_FILE_SIZE) {
          console.warn(
            `Skipping large file ${file} (${Math.round(stats.size / 1024 / 1024)}MB > ${
              MAX_FILE_SIZE / 1024 / 1024
            }MB limit)`
          )
          return
        }

        const fileContent = fs.readFileSync(file)
        uploadsFolder.file(file.replace(FILE_UPLOAD_PATH, ""), fileContent)
      } catch (error) {
        console.error(`Error reading file ${file}:`, error)
      }
    })
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

function getAllFilePaths(dirPath: string): string[] {
  let filePaths: string[] = []

  function readDirectory(currentPath: string) {
    const entries = readdirSync(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)
      if (entry.isDirectory()) {
        readDirectory(fullPath)
      } else {
        filePaths.push(fullPath)
      }
    }
  }

  readDirectory(dirPath)
  return filePaths
}

async function tableToJSON(model: any): Promise<string> {
  const data = await model.findMany()

  if (!data || data.length === 0) {
    return "[]"
  }

  return JSON.stringify(data, null, 2)
}
