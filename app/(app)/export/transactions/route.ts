import { getCurrentUser } from "@/lib/auth"
import {
  fileExists,
  fullPathForFile,
  getTransactionExportFileName,
  getTransactionExportFilePath,
  getTransactionExportRelativeFolder,
} from "@/lib/files"
import { EXPORT_AND_IMPORT_FIELD_MAP, ExportFields, ExportFilters } from "@/models/export_and_import"
import { getFields } from "@/models/fields"
import { getFilesByTransactionId } from "@/models/files"
import { updateProgress } from "@/models/progress"
import { getTransactions } from "@/models/transactions"
import { format } from "@fast-csv/format"
import fs from "fs/promises"
import JSZip from "jszip"
import { NextResponse } from "next/server"
import { Readable } from "stream"

const TRANSACTIONS_CHUNK_SIZE = 300
const FILES_CHUNK_SIZE = 50
const PROGRESS_UPDATE_INTERVAL_MS = 2000 // 2 seconds
const EXPORT_FILE_PATH_SEPARATOR = ";"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const filters = Object.fromEntries(url.searchParams.entries()) as ExportFilters
  const fields = (url.searchParams.get("fields")?.split(",") ?? []) as ExportFields
  const includeAttachments = url.searchParams.get("includeAttachments") === "true"
  const progressId = url.searchParams.get("progressId")

  const user = await getCurrentUser()
  const { transactions } = await getTransactions(user.id, filters)
  const existingFields = await getFields(user.id)

  try {
    const fieldKeys = fields.filter((field) => existingFields.some((f) => f.code === field))
    const includeFilePaths = includeAttachments && fieldKeys.includes("files")

    // Create a transform stream for CSV generation
    const csvStream = format({ headers: fieldKeys, writeBOM: true, writeHeaders: false })

    // Custom CSV headers
    const headers = fieldKeys.map((field) => existingFields.find((f) => f.code === field)?.name ?? "UNKNOWN")
    csvStream.write(headers)

    // Process transactions in chunks to avoid memory issues
    for (let i = 0; i < transactions.length; i += TRANSACTIONS_CHUNK_SIZE) {
      const chunk = transactions.slice(i, i + TRANSACTIONS_CHUNK_SIZE)
      console.log(
        `Processing transactions ${i + 1}-${Math.min(i + TRANSACTIONS_CHUNK_SIZE, transactions.length)} of ${transactions.length}`
      )

      for (const transaction of chunk) {
        const row: Record<string, unknown> = {}
        const transactionFiles = includeFilePaths ? await getFilesByTransactionId(transaction.id, user.id) : []

        for (const field of existingFields) {
          if (field.code === "files") {
            if (includeFilePaths) {
              const paths: string[] = []
              for (const file of transactionFiles) {
                const fullFilePath = fullPathForFile(user, file)
                if (await fileExists(fullFilePath)) {
                  paths.push(getTransactionExportFilePath(transaction, file, transactionFiles.length))
                }
              }
              row.files = paths.join(EXPORT_FILE_PATH_SEPARATOR)
            } else {
              row.files = ""
            }
            continue
          }

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
      return new NextResponse(stream as unknown as BodyInit, {
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

    let totalFilesProcessed = 0
    let totalFilesToProcess = 0
    let lastProgressUpdate = Date.now()

    // First count total files to process
    for (const transaction of transactions) {
      const transactionFiles = await getFilesByTransactionId(transaction.id, user.id)
      totalFilesToProcess += transactionFiles.length
    }

    // Update progress with total files if progressId is provided
    if (progressId) {
      await updateProgress(user.id, progressId, { total: totalFilesToProcess })
    }

    console.log(`Starting to process ${totalFilesToProcess} files in total`)

    for (let i = 0; i < transactions.length; i += FILES_CHUNK_SIZE) {
      const chunk = transactions.slice(i, i + FILES_CHUNK_SIZE)
      console.log(
        `Processing files for transactions ${i + 1}-${Math.min(i + FILES_CHUNK_SIZE, transactions.length)} of ${transactions.length}`
      )

      for (const transaction of chunk) {
        const transactionFiles = await getFilesByTransactionId(transaction.id, user.id)

        const transactionFolder = filesFolder.folder(getTransactionExportRelativeFolder(transaction, transactionFiles.length))

        if (!transactionFolder) continue

        for (const file of transactionFiles) {
          const fullFilePath = fullPathForFile(user, file)
          if (await fileExists(fullFilePath)) {
            console.log(
              `Processing file ${++totalFilesProcessed}/${totalFilesToProcess}: ${file.filename} for transaction ${transaction.id}`
            )
            const fileData = await fs.readFile(fullFilePath)
            transactionFolder.file(getTransactionExportFileName(transaction, file), fileData)

            // Update progress every PROGRESS_UPDATE_INTERVAL_MS milliseconds
            const now = Date.now()
            if (progressId && now - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL_MS) {
              await updateProgress(user.id, progressId, { current: totalFilesProcessed })
              lastProgressUpdate = now
            }
          } else {
            console.log(`Skipping missing file: ${file.filename} for transaction ${transaction.id}`)
          }
        }
      }
    }

    // Final progress update
    if (progressId) {
      await updateProgress(user.id, progressId, { current: totalFilesToProcess })
    }

    console.log(`Finished processing all ${totalFilesProcessed} files`)

    // Generate zip with progress tracking
    const zipContent = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6,
      },
    })

    return new NextResponse(zipContent as BodyInit, {
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
