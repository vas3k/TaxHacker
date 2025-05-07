import { getCurrentUser } from "@/lib/auth"
import { fileExists, getStaticDirectory, safePathJoin } from "@/lib/files"
import fs from "fs/promises"
import lookup from "mime-types"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  const user = await getCurrentUser()

  if (!filename) {
    return new NextResponse("No filename provided", { status: 400 })
  }

  const staticFilesDirectory = getStaticDirectory(user)

  try {
    const fullFilePath = safePathJoin(staticFilesDirectory, filename)
    const isFileExists = await fileExists(fullFilePath)
    if (!isFileExists) {
      return new NextResponse(`File not found for user: ${filename}`, { status: 404 })
    }

    const fileBuffer = await fs.readFile(fullFilePath)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": lookup.lookup(filename) || "application/octet-stream",
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
