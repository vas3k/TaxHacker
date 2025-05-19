import { getCurrentUser } from "@/lib/auth"
import { fileExists, fullPathForFile } from "@/lib/files"
import { EXPORT_AND_IMPORT_FIELD_MAP, ExportFields, ExportFilters } from "@/models/export_and_import"
import { getFields } from "@/models/fields"
import { getFilesByTransactionId } from "@/models/files"
import { getTransactions } from "@/models/transactions"
import { format } from "@fast-csv/format"
import { formatDate } from "date-fns"
import fs from "fs/promises"
import JSZip from "jszip"
import { NextResponse } from "next/server"
import path from "path"
import { Readable } from "stream"

const TRANSACTIONS_CHUNK_SIZE = 300
const FILES_CHUNK_SIZE = 50

export async function GET(request: Request) {
  const url = new URL(request.url)
  const filters = Object.fromEntries(url.searchParams.entries()) as ExportFilters
  const fields = (url.searchParams.get("fields")?.split(",") ?? []) as ExportFields
  const includeAttachments = url.searchParams.get("includeAttachments") === "true"

  const user = await getCurrentUser()
  const { transactions } = await getTransactions(user.id, filters)
  const existingFields = await getFields(user.id)

  try {
    const fieldKeys = fields.filter((field) => existingFields.some((f) => f.code === field))

    // Create a transform stream for CSV generation
    const csvStream = format({ headers: fieldKeys, writeBOM: true, writeHeaders: false })

    // Custom CSV headers
    const headers = fieldKeys.map((field) => existingFields.find((f) => f.code === field)?.name ?? "UNKNOWN")
    csvStream.write(headers)

    // Process transactions in chunks to avoid memory issues
    for (let i = 0; i < transactions.length; i += TRANSACTIONS_CHUNK_SIZE) {
      const chunk = transactions.slice(i, i + TRANSACTIONS_CHUNK_SIZE)

      for (const transaction of chunk) {
        const row: Record<string, unknown> = {}
        for (const field of existingFields) {
          let value
          if (field.isExtra) {
            value = transaction.extra?.[field.code as keyof typeof transaction.extra] ?? ""
          } else {
            value = transaction[field.code as keyof typeof transaction] ?? ""
          }

          const exportFieldSettings = EXPORT_AND_IMPORT_FIELD_MAP[field.code]
          if (exportFieldSettings && exportFieldSettings.export) {
            row[field.code] = await exportFieldSettings.export(user.id, value)
          } else {
            row[field.code] = value
          }
        }
        csvStream.write(row)
      }
    }
    csvStream.end()

    if (!includeAttachments) {
      const stream = Readable.from(csvStream)
      return new NextResponse(stream as any, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="transactions.csv"`,
        },
      })
    }

    // For ZIP files, we'll use a more memory-efficient approach
    const zip = new JSZip()

    // Add CSV to zip
    const csvContent = await new Promise<string>((resolve) => {
      let content = ""
      csvStream.on("data", (chunk) => {
        content += chunk
      })
      csvStream.on("end", () => resolve(content))
    })
    zip.file("transactions.csv", csvContent)

    // Process files in chunks
    const filesFolder = zip.folder("files")
    if (!filesFolder) {
      throw new Error("Failed to create zip folder")
    }

    for (let i = 0; i < transactions.length; i += FILES_CHUNK_SIZE) {
      const chunk = transactions.slice(i, i + FILES_CHUNK_SIZE)

      for (const transaction of chunk) {
        const transactionFiles = await getFilesByTransactionId(transaction.id, user.id)

        const transactionFolder = filesFolder.folder(
          path.join(
            transaction.issuedAt ? formatDate(transaction.issuedAt, "yyyy/MM") : "",
            transactionFiles.length > 1 ? transaction.name || transaction.id : ""
          )
        )

        if (!transactionFolder) continue

        for (const file of transactionFiles) {
          const fullFilePath = fullPathForFile(user, file)
          if (await fileExists(fullFilePath)) {
            const fileData = await fs.readFile(fullFilePath)
            const fileExtension = path.extname(fullFilePath)
            transactionFolder.file(
              `${formatDate(transaction.issuedAt || new Date(), "yyyy-MM-dd")} - ${
                transaction.name || transaction.id
              }${fileExtension}`,
              fileData
            )
          }
        }
      }
    }

    // Generate zip with progress tracking
    const zipContent = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6,
      },
    })

    return new NextResponse(zipContent, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="transactions.zip"`,
      },
    })
  } catch (error) {
    console.error("Error exporting transactions:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
