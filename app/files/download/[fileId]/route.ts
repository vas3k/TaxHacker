import { getFileById } from "@/data/files"
import fs from "fs/promises"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params

  if (!fileId) {
    return new NextResponse("No fileId provided", { status: 400 })
  }

  try {
    // Find file in database
    const file = await getFileById(fileId)

    if (!file) {
      return new NextResponse("File not found", { status: 404 })
    }

    // Check if file exists
    try {
      await fs.access(file.path)
    } catch {
      return new NextResponse("File not found on disk", { status: 404 })
    }

    // Read file
    const fileBuffer = await fs.readFile(file.path)

    // Return file with proper content type
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": file.mimetype,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
