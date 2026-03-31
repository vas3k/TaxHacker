"use server"

import { getCurrentUser, isSubscriptionExpired } from "@/lib/auth"
import {
  getTransactionFileUploadPath,
  getUserUploadsDirectory,
  isEnoughStorageToUploadFile,
  safePathJoin,
} from "@/lib/files"
import { getAppData, setAppData } from "@/models/apps"
import { createFile } from "@/models/files"
import { createTransaction, updateTransactionFiles } from "@/models/transactions"
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

export async function generateInvoicePDF(data: InvoiceFormData): Promise<Uint8Array> {
  const pdfElement = createElement(InvoicePDF, { data })
  const buffer = await renderToBuffer(pdfElement as any)
  return new Uint8Array(buffer)
}

export async function addNewTemplateAction(user: User, template: InvoiceTemplate) {
  const appData = await getAppData<InvoiceAppData>(user, "invoices")
  const updatedTemplates = [...(appData?.templates || []), template]
  const appDataResult = await setAppData(user, "invoices", { ...appData, templates: updatedTemplates })
  return { success: true, data: appDataResult }
}

export async function deleteTemplateAction(user: User, templateId: string) {
  const appData = await getAppData<InvoiceAppData>(user, "invoices")
  if (!appData) return { success: false, error: "No app data found" }

  const updatedTemplates = appData.templates.filter((t) => t.id !== templateId)
  const appDataResult = await setAppData(user, "invoices", { ...appData, templates: updatedTemplates })
  return { success: true, data: appDataResult }
}

export async function saveInvoiceAsTransactionAction(
  formData: InvoiceFormData
): Promise<{ success: boolean; error?: string; data?: Transaction }> {
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
    const transaction = await createTransaction(user.id, {
      name: `Invoice #${formData.invoiceNumber || "unknown"}`,
      merchant: `${formData.billTo.split("\n")[0]}`,
      total: totalAmount * 100,
      currencyCode: formData.currency,
      issuedAt: new Date(formData.date),
      categoryCode: null,
      projectCode: null,
      type: "income",
      status: "pending",
    })

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
