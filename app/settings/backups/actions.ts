"use server"

import { DATABASE_FILE } from "@/lib/db"
import fs from "fs"

export async function restoreBackupAction(prevState: any, formData: FormData) {
  const file = formData.get("file") as File
  if (!file) {
    return { success: false, error: "No file provided" }
  }

  try {
    const fileBuffer = await file.arrayBuffer()
    const fileData = Buffer.from(fileBuffer)
    fs.writeFileSync(DATABASE_FILE, fileData)
  } catch (error) {
    return { success: false, error: "Failed to restore backup" }
  }

  return { success: true }
}
