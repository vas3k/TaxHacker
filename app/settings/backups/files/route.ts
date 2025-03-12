import { FILE_UPLOAD_PATH } from "@/lib/files"
import fs, { readdirSync } from "fs"
import JSZip from "jszip"
import { NextResponse } from "next/server"
import path from "path"

export async function GET(request: Request) {
  try {
    const zip = new JSZip()
    const folder = zip.folder("uploads")
    if (!folder) {
      console.error("Failed to create zip folder")
      return new NextResponse("Internal Server Error", { status: 500 })
    }

    const files = getAllFilePaths(FILE_UPLOAD_PATH)
    files.forEach((file) => {
      folder.file(file.replace(FILE_UPLOAD_PATH, ""), fs.readFileSync(file))
    })
    const archive = await zip.generateAsync({ type: "blob" })

    return new NextResponse(archive, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="uploads.zip"`,
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
