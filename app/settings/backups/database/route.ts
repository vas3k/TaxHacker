import { DATABASE_FILE } from "@/lib/db"
import fs from "fs"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const file = fs.readFileSync(DATABASE_FILE)
    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="database.sqlite"`,
      },
    })
  } catch (error) {
    console.error("Error exporting database:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
