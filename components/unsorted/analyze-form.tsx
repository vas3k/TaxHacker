"use client"

import { analyzeTransaction, retrieveAllAttachmentsForAI } from "@/app/ai/analyze"
import { useNotification } from "@/app/context"
import { deleteUnsortedFileAction, saveFileAsTransactionAction } from "@/app/unsorted/actions"
import { FormConvertCurrency } from "@/components/forms/convert-currency"
import { FormError } from "@/components/forms/error"
import { FormSelectCategory } from "@/components/forms/select-category"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormSelectProject } from "@/components/forms/select-project"
import { FormSelectType } from "@/components/forms/select-type"
import { FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { Category, Currency, Field, File, Project } from "@prisma/client"
import { Brain, Loader2 } from "lucide-react"
import { startTransition, useActionState, useMemo, useState } from "react"

export default function AnalyzeForm({
  file,
  categories,
  projects,
  currencies,
  fields,
  settings,
}: {
  file: File
  categories: Category[]
  projects: Project[]
  currencies: Currency[]
  fields: Field[]
  settings: Record<string, string>
}) {
  const { showNotification } = useNotification()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeStep, setAnalyzeStep] = useState<string>("")
  const [analyzeError, setAnalyzeError] = useState<string>("")
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteUnsortedFileAction, null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const fieldsMap = useMemo(
    () =>
      fields.reduce((acc, field) => {
        acc[field.code] = field
        return acc
      }, {} as Record<string, Field>),
    [fields]
  )
  const extraFields = useMemo(() => fields.filter((field) => field.isExtra), [fields])
  const initialFormState = useMemo(
    () => ({
      name: file.filename,
      merchant: "",
      description: "",
      type: settings.default_type,
      total: 0.0,
      currencyCode: settings.default_currency,
      convertedTotal: 0.0,
      convertedCurrencyCode: settings.default_currency,
      categoryCode: settings.default_category,
      projectCode: settings.default_project,
      issuedAt: "",
      note: "",
      text: "",
      ...extraFields.reduce((acc, field) => {
        acc[field.code] = ""
        return acc
      }, {} as Record<string, string>),
    }),
    [file.filename, settings, extraFields]
  )
  const [formData, setFormData] = useState(initialFormState)

  async function saveAsTransaction(formData: FormData) {
    setSaveError("")
    setIsSaving(true)
    startTransition(async () => {
      const result = await saveFileAsTransactionAction(null, formData)
      setIsSaving(false)

      if (result.success) {
        showNotification({ code: "sidebar.transactions", message: "new" })
        setTimeout(() => showNotification({ code: "sidebar.transactions", message: "" }), 3000)
      } else {
        setSaveError(result.error ? result.error : "Something went wrong...")
      }
    })
  }

  const startAnalyze = async () => {
    setIsAnalyzing(true)
    setAnalyzeStep("Retrieving files...")
    setAnalyzeError("")
    try {
      const attachments = await retrieveAllAttachmentsForAI(file)

      setAnalyzeStep("Analyzing...")
      const results = await analyzeTransaction(
        settings.prompt_analyse_new_file || process.env.PROMPT_ANALYSE_NEW_FILE || "",
        settings,
        fields,
        categories,
        projects,
        attachments
      )

      console.log("Analysis results:", results)

      if (!results.success) {
        setAnalyzeError(results.error ? results.error : "Something went wrong...")
      } else {
        const nonEmptyFields = Object.fromEntries(
          Object.entries(results.data || {}).filter(
            ([_, value]) => value !== null && value !== undefined && value !== ""
          )
        )
        console.log("Setting form data:", nonEmptyFields)
        setFormData({ ...formData, ...nonEmptyFields })
      }
    } catch (error) {
      console.error("Analysis failed:", error)
      setAnalyzeError(error instanceof Error ? error.message : "Analysis failed")
    } finally {
      setIsAnalyzing(false)
      setAnalyzeStep("")
    }
  }

  return (
    <>
      <Button className="w-full mb-6 py-6 text-lg" onClick={startAnalyze} disabled={isAnalyzing}>
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>{analyzeStep}</span>
          </>
        ) : (
          <>
            <Brain className="mr-2 h-4 w-4" />
            <span>Analyze with AI</span>
          </>
        )}
      </Button>

      {analyzeError && <FormError>⚠️ {analyzeError}</FormError>}

      <form className="space-y-4" action={saveAsTransaction}>
        <input type="hidden" name="fileId" value={file.id} />
        <FormInput
          title="Name"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required={true}
        />

        <FormInput
          title="Merchant"
          name="merchant"
          value={formData.merchant}
          onChange={(e) => setFormData((prev) => ({ ...prev, merchant: e.target.value }))}
          hideIfEmpty={!fieldsMap["merchant"]?.isVisibleInAnalysis}
        />

        <FormInput
          title="Description"
          name="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          hideIfEmpty={!fieldsMap["description"]?.isVisibleInAnalysis}
        />

        <div className="flex flex-wrap gap-4">
          <FormInput
            title="Total"
            name="total"
            type="number"
            step="0.01"
            value={formData.total || ""}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value || "0")
              !isNaN(newValue) && setFormData((prev) => ({ ...prev, total: newValue }))
            }}
            className="w-32"
            required={true}
          />

          <FormSelectCurrency
            title="Currency"
            currencies={currencies}
            name="currencyCode"
            value={formData.currencyCode}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, currencyCode: value }))}
            hideIfEmpty={!fieldsMap["currencyCode"]?.isVisibleInAnalysis}
          />

          <FormSelectType
            title="Type"
            name="type"
            value={formData.type}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
            hideIfEmpty={!fieldsMap["type"]?.isVisibleInAnalysis}
          />
        </div>

        {formData.total != 0 && formData.currencyCode && formData.currencyCode !== settings.default_currency && (
          <>
            <FormConvertCurrency
              originalTotal={formData.total}
              originalCurrencyCode={formData.currencyCode}
              targetCurrencyCode={settings.default_currency}
              date={formData.issuedAt ? new Date(formData.issuedAt) : undefined}
              onChange={(value) => setFormData((prev) => ({ ...prev, convertedTotal: value }))}
            />
            <input type="hidden" name="convertedCurrencyCode" value={settings.default_currency} />
          </>
        )}

        <div className="flex flex-row gap-4">
          <FormInput
            title="Issued At"
            type="date"
            name="issuedAt"
            value={formData.issuedAt}
            onChange={(e) => setFormData((prev) => ({ ...prev, issuedAt: e.target.value }))}
            hideIfEmpty={!fieldsMap["issuedAt"]?.isVisibleInAnalysis}
          />
        </div>

        <div className="flex flex-row gap-4">
          <FormSelectCategory
            title="Category"
            categories={categories}
            name="categoryCode"
            value={formData.categoryCode}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryCode: value }))}
            placeholder="Select Category"
            hideIfEmpty={!fieldsMap["categoryCode"]?.isVisibleInAnalysis}
          />

          {projects.length > 0 && (
            <FormSelectProject
              title="Project"
              projects={projects}
              name="projectCode"
              value={formData.projectCode}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, projectCode: value }))}
              placeholder="Select Project"
              hideIfEmpty={!fieldsMap["projectCode"]?.isVisibleInAnalysis}
            />
          )}
        </div>

        <FormInput
          title="Note"
          name="note"
          value={formData.note}
          onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
          hideIfEmpty={!fieldsMap["note"]?.isVisibleInAnalysis}
        />

        {extraFields.map((field) => (
          <FormInput
            key={field.code}
            type={field.type}
            title={field.name}
            name={field.code}
            value={formData[field.code as keyof typeof formData]}
            onChange={(e) => setFormData((prev) => ({ ...prev, [field.code]: e.target.value }))}
            hideIfEmpty={!field.isVisibleInAnalysis}
          />
        ))}

        <div className="hidden">
          <FormTextarea
            title="Recognized Text"
            name="text"
            value={formData.text}
            onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
            hideIfEmpty={!fieldsMap["text"]?.isVisibleInAnalysis}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            onClick={() => startTransition(() => deleteAction(file.id))}
            variant="outline"
            disabled={isDeleting}
          >
            {isDeleting ? "⏳ Deleting..." : "Delete"}
          </Button>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save as Transaction"
            )}
          </Button>

          {deleteState?.error && <FormError>⚠️ {deleteState.error}</FormError>}
          {saveError && <FormError>⚠️ {saveError}</FormError>}
        </div>
      </form>
    </>
  )
}
