import { ExportFields, ExportFilters, exportImportFieldsMapping } from "@/data/export_and_import"
import { getFields } from "@/data/fields"
import { getFilesByTransactionId } from "@/data/files"
import { getTransactions } from "@/data/transactions"
import { format } from "@fast-csv/format"
import { formatDate } from "date-fns"
import fs from "fs"
import JSZip from "jszip"
import { NextResponse } from "next/server"
import path from "path"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const filters = Object.fromEntries(url.searchParams.entries()) as ExportFilters
  const fields = (url.searchParams.get("fields")?.split(",") ?? []) as ExportFields
  const includeAttachments = url.searchParams.get("includeAttachments") === "true"

  const transactions = await getTransactions(filters)
  const existingFields = await getFields()

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
      for (const key of fieldKeys) {
        const value = transaction[key as keyof typeof transaction] ?? ""
        const exportFieldSettings = exportImportFieldsMapping[key]
        if (exportFieldSettings && exportFieldSettings.export) {
          row[key] = await exportFieldSettings.export(value)
        } else {
          row[key] = value
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
      const transactionFiles = await getFilesByTransactionId(transaction.id)

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
        const fileData = fs.readFileSync(file.path)
        const fileExtension = path.extname(file.path)
        transactionFolder.file(
          `${formatDate(transaction.issuedAt || new Date(), "yyyy-MM-dd")} - ${
            transaction.name || transaction.id
          }${fileExtension}`,
          fileData
        )
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
