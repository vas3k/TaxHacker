"use server"

// File-like interface for form data uploads (avoids runtime File check issues in Node.js)
interface UploadedFile {
  name: string
  size: number
  type: string
  arrayBuffer(): Promise<ArrayBuffer>
}

import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { EXPORT_AND_IMPORT_FIELD_MAP } from "@/models/export_and_import"
import { createTransaction } from "@/models/transactions"
import { Transaction } from "@/prisma/client"
import { parse } from "@fast-csv/parse"
import { revalidatePath } from "next/cache"

export async function parseCSVAction(
  _prevState: ActionState<string[][]> | null,
  formData: FormData
): Promise<ActionState<string[][]>> {
  const file = formData.get("file") as UploadedFile | null
  if (!file) {
    return { success: false, error: "No file uploaded" }
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { success: false, error: "Only CSV files are allowed" }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const rows: string[][] = []

    const parser = parse()
      .on("data", (row) => rows.push(row))
      .on("error", (error) => {
        throw error
      })
    parser.write(buffer)
    parser.end()

    // Wait for parsing to complete
    await new Promise((resolve) => parser.on("end", resolve))

    return { success: true, data: rows }
  } catch (error) {
    console.error("Error parsing CSV:", error)
    return { success: false, error: "Failed to parse CSV file" }
  }
}

export async function saveTransactionsAction(
  _prevState: ActionState<Transaction> | null,
  formData: FormData
): Promise<ActionState<Transaction>> {
  const user = await getCurrentUser()
  try {
    const rows = JSON.parse(formData.get("rows") as string) as Record<string, unknown>[]

    for (const row of rows) {
      const transactionData: Record<string, unknown> = {}
      for (const [fieldCode, value] of Object.entries(row)) {
        const fieldDef = EXPORT_AND_IMPORT_FIELD_MAP[fieldCode]
        if (fieldDef?.import) {
          transactionData[fieldCode] = await fieldDef.import(user.id, value as string)
        } else {
          transactionData[fieldCode] = value as string
        }
      }

      await createTransaction(user.id, transactionData)
    }

    revalidatePath("/import/csv")
    revalidatePath("/transactions")

    return { success: true }
  } catch (error) {
    console.error("Error saving transactions:", error)
    return { success: false, error: "Failed to save transactions: " + error }
  }
}
