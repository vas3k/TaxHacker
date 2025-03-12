import { DATABASE_FILE } from "@/lib/db"
import fs from "fs"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return new NextResponse("No file provided", { status: 400 })
    }

    const fileBuffer = await file.arrayBuffer()
    const fileData = Buffer.from(fileBuffer)

    fs.writeFileSync(DATABASE_FILE, fileData)

    return new NextResponse("File restored", { status: 200 })
  } catch (error) {
    console.error("Error restoring from backup:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
