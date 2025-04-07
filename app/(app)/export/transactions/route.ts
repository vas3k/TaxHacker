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

export async function GET(request: Request) {
  const url = new URL(request.url)
  const filters = Object.fromEntries(url.searchParams.entries()) as ExportFilters
  const fields = (url.searchParams.get("fields")?.split(",") ?? []) as ExportFields
  const includeAttachments = url.searchParams.get("includeAttachments") === "true"

  const user = await getCurrentUser()
  const { transactions } = await getTransactions(user.id, filters)
  const existingFields = await getFields(user.id)

  // Generate CSV file with all transactions
  try {
    const fieldKeys = fields.filter((field) => existingFields.some((f) => f.code === field))

    let csvContent = ""
    const csvStream = format({ headers: fieldKeys, writeBOM: true, writeHeaders: false })

    csvStream.on("data", (chunk) => {
      csvContent += chunk
    })

    // Custom CSV headers
    const headers = fieldKeys.map((field) => existingFields.find((f) => f.code === field)?.name ?? "UNKNOWN")
    csvStream.write(headers)

    // CSV rows
    for (const transaction of transactions) {
      const row: Record<string, any> = {}
      for (const field of existingFields) {
        let value
        if (field.isExtra) {
          value = transaction.extra?.[field.code as keyof typeof transaction.extra] ?? ""
        } else {
          value = transaction[field.code as keyof typeof transaction] ?? ""
        }

        // Check if the field has a special export rules
        const exportFieldSettings = EXPORT_AND_IMPORT_FIELD_MAP[field.code]
        if (exportFieldSettings && exportFieldSettings.export) {
          row[field.code] = await exportFieldSettings.export(user.id, value)
        } else {
          row[field.code] = value
        }
      }

      csvStream.write(row)
    }
    csvStream.end()

    // Wait for CSV generation to complete
    await new Promise((resolve) => csvStream.on("end", resolve))

    if (!includeAttachments) {
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="transactions.csv"`,
        },
      })
    }

    // If includeAttachments is true, create a ZIP file with the CSV and attachments
    const zip = new JSZip()
    zip.file("transactions.csv", csvContent)

    const filesFolder = zip.folder("files")
    if (!filesFolder) {
      console.error("Failed to create zip folder")
      return new NextResponse("Internal Server Error", { status: 500 })
    }

    for (const transaction of transactions) {
      const transactionFiles = await getFilesByTransactionId(transaction.id, user.id)

      const transactionFolder = filesFolder.folder(
        path.join(
          transaction.issuedAt ? formatDate(transaction.issuedAt, "yyyy/MM") : "",
          transactionFiles.length > 1 ? transaction.name || transaction.id : ""
        )
      )
      if (!transactionFolder) {
        console.error(`Failed to create transaction folder for ${transaction.name}`)
        continue
      }

      for (const file of transactionFiles) {
        const fullFilePath = await fullPathForFile(user, file)
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

    const zipContent = await zip.generateAsync({ type: "uint8array" })

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
