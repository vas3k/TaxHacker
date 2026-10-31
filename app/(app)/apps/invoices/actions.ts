"use server"

import * as React from "react"
import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import { getCurrentUser, isSubscriptionExpired } from "@/lib/auth"
import {
  getTransactionFileUploadPath,
  getUserUploadsDirectory,
  isEnoughStorageToUploadFile,
  safePathJoin,
} from "@/lib/files"
import { getAppData, setAppData } from "@/models/apps"
import { createFile } from "@/models/files"
import {
  createTransaction,
  updateTransactionFiles,
  TransactionData,
  findDuplicateTransaction,
} from "@/models/transactions"
import { Transaction, User } from "@/prisma/client"
import { renderToBuffer } from "@react-pdf/renderer"
import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import { revalidatePath } from "next/cache"
import path from "path"
import { createElement } from "react"
import { InvoiceFormData } from "./components/invoice-page"
import { InvoicePDF } from "./components/invoice-pdf"
import { InvoiceTemplate } from "./default-templates"
import { InvoiceAppData } from "./page"

const BLOCKED_V4_RANGES: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
]

function ipv4ToInt(address: string): number {
  return address.split(".").reduce((acc, octet) => acc * 256 + Number(octet), 0) >>> 0
}

/** Loopback, link-local, private, CGNAT, documentation and multicast space. */
function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const value = ipv4ToInt(address)
    return BLOCKED_V4_RANGES.some(([base, bits]) => {
      const size = 2 ** (32 - bits)
      return value >= ipv4ToInt(base) && value < ipv4ToInt(base) + size
    })
  }
  if (isIP(address) === 6) {
    const lower = address.toLowerCase()
    if (lower === "::" || lower === "::1") return true
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateAddress(mapped[1])
    return lower.startsWith("fc") || lower.startsWith("fd") || /^fe[89ab]/.test(lower) || lower.startsWith("ff")
  }
  return true
}

/** A logo source @react-pdf/renderer may resolve server-side: an inline data
 *  URL (what the invoice generator sends), or an http(s) URL whose host
 *  resolves only to public addresses. A local path or a file: URL is refused
 *  before the renderer can read it into the PDF. */
async function assertSafeLogoSource(value: string | null | undefined): Promise<void> {
  if (!value || value.trim() === "") return

  const raw = value.trim()
  if (/^data:/i.test(raw)) return

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error("Invoice logo must be an http(s) or data URL")
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Invoice logo must be an http(s) or data URL, not ${url.protocol}`)
  }

  const host = url.hostname.replace(/^\[|\]$/g, "")
  if (isIP(host)) {
    if (isPrivateAddress(host)) {
      throw new Error(`Invoice logo host ${host} is a loopback, link-local or private address`)
    }
    return
  }
  const addresses = await lookup(host, { all: true, verbatim: true })
  if (addresses.length === 0) throw new Error(`Invoice logo host ${host} did not resolve`)
  for (const entry of addresses) {
    if (isPrivateAddress(entry.address)) {
      throw new Error(`Invoice logo host ${host} resolves to ${entry.address}, a loopback, link-local or private address`)
    }
  }
}

export async function generateInvoicePDF(data: InvoiceFormData): Promise<Uint8Array> {
  await assertSafeLogoSource(data.businessLogo)

  const pdfElement = createElement(InvoicePDF, { data })
  const buffer = await renderToBuffer(pdfElement as unknown as React.ReactElement<Record<string, never>>)
  return new Uint8Array(buffer)
}

export async function addNewTemplateAction(user: User, template: InvoiceTemplate) {
  const appData = (await getAppData(user, "invoices")) as InvoiceAppData | null
  const updatedTemplates = [...(appData?.templates || []), template]
  const appDataResult = await setAppData(user, "invoices", { ...appData, templates: updatedTemplates })
  return { success: true, data: appDataResult }
}

export async function deleteTemplateAction(user: User, templateId: string) {
  const appData = (await getAppData(user, "invoices")) as InvoiceAppData | null
  if (!appData) return { success: false, error: "No app data found" }

  const updatedTemplates = appData.templates.filter((t) => t.id !== templateId)
  const appDataResult = await setAppData(user, "invoices", { ...appData, templates: updatedTemplates })
  return { success: true, data: appDataResult }
}

export async function saveInvoiceAsTransactionAction(
  formData: InvoiceFormData,
  forceSave: boolean = false
): Promise<{
  success: boolean
  error?: string
  data?: Transaction
  duplicateData?: {
    existingTransaction: Transaction
    newTransactionData: Record<string, unknown>
  }
}> {
  try {
    const user = await getCurrentUser()

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(formData)

    // Calculate total amount from items
    const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0)
    const taxes = formData.additionalTaxes.reduce((sum, tax) => sum + tax.amount, 0)
    const fees = formData.additionalFees.reduce((sum, fee) => sum + fee.amount, 0)
    const totalAmount = (formData.taxIncluded ? subtotal : subtotal + taxes) + fees

    // Create transaction
    const rawTransactionData: TransactionData = {
      name: `Invoice #${formData.invoiceNumber || "unknown"}`,
      merchant: `${formData.billTo.split("\n")[0]}`,
      total: totalAmount * 100,
      currencyCode: formData.currency,
      issuedAt: new Date(formData.date),
      categoryCode: null,
      projectCode: null,
      type: "income",
      status: "pending",
    }

    // --- Deduplication Check ---
    if (!forceSave) {
      const existingTransaction = await findDuplicateTransaction(user.id, rawTransactionData)

      if (existingTransaction) {
        return {
          success: false,
          error: "DUPLICATE_FOUND",
          duplicateData: {
            existingTransaction: existingTransaction,
            newTransactionData: rawTransactionData,
          },
        }
      }
    }

    const transaction = await createTransaction(user.id, rawTransactionData)

    // Check storage limits
    if (!isEnoughStorageToUploadFile(user, pdfBuffer.length)) {
      return {
        success: false,
        error: "Insufficient storage to save invoice PDF",
      }
    }

    if (isSubscriptionExpired(user)) {
      return {
        success: false,
        error: "Your subscription has expired, please upgrade your account or buy new subscription plan",
      }
    }

    // Save PDF file
    const fileUuid = randomUUID()
    const fileName = `invoice-${formData.invoiceNumber}.pdf`
    const relativeFilePath = getTransactionFileUploadPath(fileUuid, fileName, transaction)
    const userUploadsDirectory = getUserUploadsDirectory(user)
    const fullFilePath = safePathJoin(userUploadsDirectory, relativeFilePath)

    await mkdir(path.dirname(fullFilePath), { recursive: true })
    await writeFile(fullFilePath, pdfBuffer)

    // Create file record in database
    const fileRecord = await createFile(user.id, {
      id: fileUuid,
      filename: fileName,
      path: relativeFilePath,
      mimetype: "application/pdf",
      isReviewed: true,
      metadata: {
        size: pdfBuffer.length,
        lastModified: Date.now(),
      },
    })

    // Update transaction with the file ID
    await updateTransactionFiles(transaction.id, user.id, [fileRecord.id])

    revalidatePath("/transactions")

    return { success: true, data: transaction }
  } catch (error) {
    console.error("Failed to save invoice as transaction:", error)
    return {
      success: false,
      error: `Failed to save invoice as transaction: ${error}`,
    }
  }
}
