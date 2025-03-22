import { resizeImage } from "@/lib/images"
import { pdfToImages } from "@/lib/pdf"
import { getFileById } from "@/models/files"
import fs from "fs/promises"
import { NextResponse } from "next/server"
import path from "path"

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params

  if (!fileId) {
    return new NextResponse("No fileId provided", { status: 400 })
  }

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get("page") || "1", 10)

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
      return new NextResponse(`File not found on disk: ${file.path}`, { status: 404 })
    }

    let previewPath = file.path
    let previewType = file.mimetype

    if (file.mimetype === "application/pdf") {
      const { contentType, pages } = await pdfToImages(file.path)
      if (page > pages.length) {
        return new NextResponse("Page not found", { status: 404 })
      }
      previewPath = pages[page - 1] || file.path
      previewType = contentType
    } else if (file.mimetype.startsWith("image/")) {
      const { contentType, resizedPath } = await resizeImage(file.path)
      previewPath = resizedPath
      previewType = contentType
    } else {
      previewPath = file.path
      previewType = file.mimetype
    }

    // Read filex
    const fileBuffer = await fs.readFile(previewPath)

    // Return file with proper content type
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": previewType,
        "Content-Disposition": `inline; filename="${path.basename(previewPath)}"`,
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
