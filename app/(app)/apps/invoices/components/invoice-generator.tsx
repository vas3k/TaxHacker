"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { fetchAsBase64 } from "@/lib/utils"
import { SettingsMap } from "@/models/settings"
import { Currency, User } from "@/prisma/client"
import { FileDown, Loader2, Save, TextSelect, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { startTransition, useMemo, useReducer, useState } from "react"
import {
  addNewTemplateAction,
  deleteTemplateAction,
  generateInvoicePDF,
  saveInvoiceAsTransactionAction,
} from "../actions"
import defaultTemplates, { InvoiceTemplate } from "../default-templates"
import { InvoiceAppData } from "../page"
import { InvoiceFormData, InvoicePage } from "./invoice-page"

function invoiceFormReducer(state: InvoiceFormData, action: any): InvoiceFormData {
  switch (action.type) {
    case "SET_FORM":
      return action.payload
    case "UPDATE_FIELD":
      return { ...state, [action.field]: action.value }
    case "ADD_ITEM":
      return { ...state, items: [...state.items, { description: "", quantity: 1, unitPrice: 0, subtotal: 0 }] }
    case "UPDATE_ITEM": {
      const items = [...state.items]
      items[action.index] = { ...items[action.index], [action.field]: action.value }
      if (action.field === "quantity" || action.field === "unitPrice") {
        items[action.index].subtotal = Number(items[action.index].quantity) * Number(items[action.index].unitPrice)
      }
      return { ...state, items }
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((_, i) => i !== action.index) }
    case "ADD_TAX":
      return { ...state, additionalTaxes: [...state.additionalTaxes, { name: "", rate: 0, amount: 0 }] }
    case "UPDATE_TAX": {
      const taxes = [...state.additionalTaxes]
      taxes[action.index] = { ...taxes[action.index], [action.field]: action.value }
      if (action.field === "rate") {
        const subtotal = state.items.reduce((sum, item) => sum + item.subtotal, 0)
        taxes[action.index].amount = (subtotal * Number(action.value)) / 100
      }
      return { ...state, additionalTaxes: taxes }
    }
    case "REMOVE_TAX":
      return { ...state, additionalTaxes: state.additionalTaxes.filter((_, i) => i !== action.index) }
    case "ADD_FEE":
      return { ...state, additionalFees: [...state.additionalFees, { name: "", amount: 0 }] }
    case "UPDATE_FEE": {
      const fees = [...state.additionalFees]
      fees[action.index] = { ...fees[action.index], [action.field]: action.value }
      return { ...state, additionalFees: fees }
    }
    case "REMOVE_FEE":
      return { ...state, additionalFees: state.additionalFees.filter((_, i) => i !== action.index) }
    default:
      return state
  }
}

export function InvoiceGenerator({
  user,
  settings,
  currencies,
  appData,
}: {
  user: User
  settings: SettingsMap
  currencies: Currency[]
  appData: InvoiceAppData | null
}) {
  const templates: InvoiceTemplate[] = useMemo(
    () => [...defaultTemplates(user, settings), ...(appData?.templates || [])],
    [appData]
  )

  const [selectedTemplate, setSelectedTemplate] = useState<string>(templates[0].name)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [formData, dispatch] = useReducer(invoiceFormReducer, templates[0].formData)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isSavingTransaction, setIsSavingTransaction] = useState(false)

  const router = useRouter()

  // Function to handle template selection
  const handleTemplateSelect = (templateName: string) => {
    const template = templates.find((t) => t.name === templateName)
    if (template) {
      setSelectedTemplate(templateName)
      dispatch({ type: "SET_FORM", payload: template.formData })
    }
  }

  const handleGeneratePDF = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPdfLoading(true)

    try {
      if (formData.businessLogo) {
        formData.businessLogo = await fetchAsBase64(formData.businessLogo)
      }

      const pdfBuffer = await generateInvoicePDF(formData)

      // Create a blob from the buffer
      const blob = new Blob([pdfBuffer], { type: "application/pdf" })

      // Create a URL for the blob
      const url = URL.createObjectURL(blob)

      // Create a temporary link element
      const link = document.createElement("a")
      link.href = url
      link.download = `invoice-${formData.invoiceNumber}.pdf`

      // Append the link to the document, click it, and remove it
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the URL
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsPdfLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert("Please enter a template name")
      return
    }

    if (templates.some((t) => t.name === newTemplateName)) {
      alert("A template with this name already exists")
      return
    }

    try {
      // Get existing templates
      const result = await addNewTemplateAction(user, {
        id: `tmpl_${Math.random().toString(36).substring(2, 15)}`,
        name: newTemplateName,
        formData: formData,
      })

      if (result.success) {
        setIsTemplateDialogOpen(false)
        setNewTemplateName("")
        router.refresh()
      } else {
        alert("Failed to save template. Please try again.")
      }
    } catch (error) {
      console.error("Error saving template:", error)
      alert("Failed to save template. Please try again.")
    }
  }

  const handleDeleteTemplate = async (templateId: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!templateId) return // Don't allow deleting default templates

    try {
      const result = await deleteTemplateAction(user, templateId)
      if (result.success) {
        router.refresh()
      }
    } catch (error) {
      console.error("Error deleting template:", error)
      alert("Failed to delete template. Please try again.")
    }
  }

  // Accept optional event, prevent default only if present
  const handleSaveAsTransaction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSavingTransaction(true)

    try {
      if (formData.businessLogo) {
        formData.businessLogo = await fetchAsBase64(formData.businessLogo)
      }

      const result = await saveInvoiceAsTransactionAction(formData)
      if (result.success && result.data?.id) {
        console.log("SUCCESS! REDIRECTING TO TRANSACTION", result.data?.id)
        startTransition(() => {
          router.push(`/transactions/${result.data?.id}`)
        })
      } else {
        alert(result.error || "Failed to save as transaction")
      }
    } catch (error) {
      console.error("Error saving as transaction:", error)
      alert("Failed to save as transaction. Please try again.")
    } finally {
      setIsSavingTransaction(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Templates Section */}
      <div className="py-4 flex overflow-x-auto gap-2">
        {templates.map((template) => (
          <div key={template.name} className="relative group">
            <Button
              variant={selectedTemplate === template.name ? "default" : "outline"}
              className={`
                  whitespace-nowrap p-4 
                  ${selectedTemplate === template.name ? "bg-black hover:bg-gray-900" : "border-gray-300 text-gray-700 hover:bg-gray-100"}
                `}
              onClick={() => handleTemplateSelect(template.name)}
            >
              {template.name}
            </Button>
            {template.id && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteTemplate(template.id, e)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-row flex-wrap justify-start items-start gap-4">
        <InvoicePage invoiceData={formData} dispatch={dispatch} currencies={currencies} />

        {/* Generate PDF Button */}
        <div className="flex flex-col gap-4">
          <Button onClick={handleGeneratePDF} disabled={isPdfLoading}>
            {isPdfLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="mr-2" />
                Download PDF
              </>
            )}
          </Button>
          <Button variant="secondary" onClick={() => setIsTemplateDialogOpen(true)}>
            <TextSelect />
            Make a Template
          </Button>
          <Button variant="secondary" onClick={handleSaveAsTransaction} disabled={isSavingTransaction}>
            {isSavingTransaction ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2" />
                Save as Transaction
              </>
            )}
          </Button>
        </div>
      </div>

      {/* New Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="Enter template name"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
