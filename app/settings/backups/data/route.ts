import { DATABASE_FILE } from "@/lib/db"
import { FILE_UPLOAD_PATH } from "@/lib/files"
import fs, { readdirSync } from "fs"
import JSZip from "jszip"
import { NextResponse } from "next/server"
import path from "path"

export async function GET(request: Request) {
  try {
    const zip = new JSZip()
    const rootFolder = zip.folder("data")
    if (!rootFolder) {
      console.error("Failed to create zip folder")
      return new NextResponse("Internal Server Error", { status: 500 })
    }

    const databaseFile = fs.readFileSync(DATABASE_FILE)
    rootFolder.file("database.sqlite", databaseFile)

    const uploadsFolder = rootFolder.folder("uploads")
    if (!uploadsFolder) {
      console.error("Failed to create uploads folder")
      return new NextResponse("Internal Server Error", { status: 500 })
    }

    const uploadedFiles = getAllFilePaths(FILE_UPLOAD_PATH)
    uploadedFiles.forEach((file) => {
      uploadsFolder.file(file.replace(FILE_UPLOAD_PATH, ""), fs.readFileSync(file))
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
