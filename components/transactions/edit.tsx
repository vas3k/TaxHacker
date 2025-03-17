"use client"

import { deleteTransactionAction, saveTransactionAction } from "@/app/transactions/actions"
import { FormSelectCategory } from "@/components/forms/select-category"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormSelectProject } from "@/components/forms/select-project"
import { FormSelectType } from "@/components/forms/select-type"
import { FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { Category, Currency, Field, Project, Transaction } from "@prisma/client"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { startTransition, useActionState, useEffect, useState } from "react"

export default function TransactionEditForm({
  transaction,
  categories,
  projects,
  currencies,
  fields,
  settings,
}: {
  transaction: Transaction
  categories: Category[]
  projects: Project[]
  currencies: Currency[]
  fields: Field[]
  settings: Record<string, string>
}) {
  const router = useRouter()
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteTransactionAction, null)
  const [saveState, saveAction, isSaving] = useActionState(saveTransactionAction, null)

  const extraFields = fields.filter((field) => field.isExtra)
  const [formData, setFormData] = useState({
    name: transaction.name || "",
    merchant: transaction.merchant || "",
    description: transaction.description || "",
    total: transaction.total ? transaction.total / 100 : 0.0,
    currencyCode: transaction.currencyCode || settings.default_currency,
    convertedTotal: transaction.convertedTotal ? transaction.convertedTotal / 100 : 0.0,
    convertedCurrencyCode: transaction.convertedCurrencyCode,
    type: transaction.type || "expense",
    categoryCode: transaction.categoryCode || settings.default_category,
    projectCode: transaction.projectCode || settings.default_project,
    issuedAt: transaction.issuedAt ? format(transaction.issuedAt, "yyyy-MM-dd") : "",
    note: transaction.note || "",
    ...extraFields.reduce((acc, field) => {
      acc[field.code] = transaction.extra?.[field.code as keyof typeof transaction.extra] || ""
      return acc
    }, {} as Record<string, any>),
  })

  const handleDelete = async () => {
    startTransition(async () => {
      await deleteAction(transaction.id)
      router.back()
    })
  }

  useEffect(() => {
    if (saveState?.success) {
      router.back()
    }
  }, [saveState, router])

  return (
    <form action={saveAction} className="space-y-4">
      <input type="hidden" name="transactionId" value={transaction.id} />

      <FormInput title="Name" name="name" defaultValue={formData.name} />

      <FormInput title="Merchant" name="merchant" defaultValue={formData.merchant} />

      <FormInput title="Description" name="description" defaultValue={formData.description} />

      <div className="flex flex-row gap-4">
        <FormInput
          title="Total"
          type="number"
          step="0.01"
          name="total"
          defaultValue={formData.total.toFixed(2)}
          className="w-32"
        />

        <FormSelectCurrency
          title="Currency"
          name="currencyCode"
          value={formData.currencyCode}
          onValueChange={(value) => {
            setFormData({ ...formData, currencyCode: value })
          }}
          currencies={currencies}
        />

        <FormSelectType title="Type" name="type" defaultValue={formData.type} />
      </div>

      {formData.currencyCode !== settings.default_currency || formData.convertedTotal !== 0 ? (
        <div className="flex flex-row gap-4">
          <FormInput
            title={`Total converted to ${formData.convertedCurrencyCode || "UNKNOWN CURRENCY"}`}
            type="number"
            step="0.01"
            name="convertedTotal"
            defaultValue={formData.convertedTotal.toFixed(2)}
          />
          {(!formData.convertedCurrencyCode || formData.convertedCurrencyCode !== settings.default_currency) && (
            <FormSelectCurrency
              title="Convert to"
              name="convertedCurrencyCode"
              defaultValue={formData.convertedCurrencyCode || settings.default_currency}
              currencies={currencies}
            />
          )}
        </div>
      ) : (
        <></>
      )}

      <div className="flex flex-row flex-grow gap-4">
        <FormInput title="Issued At" type="date" name="issuedAt" defaultValue={formData.issuedAt} />
      </div>

      <div className="flex flex-row gap-4">
        <FormSelectCategory
          title="Category"
          categories={categories}
          name="categoryCode"
          defaultValue={formData.categoryCode}
        />

        <FormSelectProject title="Project" projects={projects} name="projectCode" defaultValue={formData.projectCode} />
      </div>

      <FormTextarea title="Note" name="note" defaultValue={formData.note} className="h-24" />
      {extraFields.map((field) => (
        <FormInput
          key={field.code}
          type={field.type}
          title={field.name}
          name={field.code}
          defaultValue={formData[field.code as keyof typeof formData] || ""}
        />
      ))}

      <div className="flex justify-end space-x-4 pt-6">
        <Button type="button" onClick={handleDelete} variant="destructive" disabled={isDeleting}>
          {isDeleting ? "⏳ Deleting..." : "Delete Transaction"}
        </Button>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>

        {deleteState?.error && <span className="text-red-500">⚠️ {deleteState.error}</span>}
        {saveState?.error && <span className="text-red-500">⚠️ {saveState.error}</span>}
      </div>
    </form>
  )
}
