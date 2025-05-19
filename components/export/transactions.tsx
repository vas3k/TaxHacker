"use client"

import { DateRangePicker } from "@/components/forms/date-range-picker"
import { FormSelectCategory } from "@/components/forms/select-category"
import { FormSelectProject } from "@/components/forms/select-project"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useTransactionFilters } from "@/hooks/use-transaction-filters"
import { Category, Field, Project } from "@/prisma/client"
import { formatDate } from "date-fns"
import { Download, Loader2 } from "lucide-react"
import { useState } from "react"

const deselectedFields = ["files", "text"]

export function ExportTransactionsDialog({
  fields,
  categories,
  projects,
  total,
  children,
}: {
  fields: Field[]
  categories: Category[]
  projects: Project[]
  total: number
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [exportFilters, setExportFilters] = useTransactionFilters()
  const [exportFields, setExportFields] = useState<string[]>(
    fields.map((field) => (deselectedFields.includes(field.code) ? "" : field.code))
  )
  const [includeAttachments, setIncludeAttachments] = useState(true)

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(
        `/export/transactions?${new URLSearchParams({
          search: exportFilters?.search || "",
          dateFrom: exportFilters?.dateFrom || "",
          dateTo: exportFilters?.dateTo || "",
          ordering: exportFilters?.ordering || "",
          categoryCode: exportFilters?.categoryCode || "",
          projectCode: exportFilters?.projectCode || "",
          fields: exportFields.join(","),
          includeAttachments: includeAttachments.toString(),
        }).toString()}`
      )

      if (!response.ok) {
        throw new Error("Export failed")
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition")
      const filename = contentDisposition?.split("filename=")[1]?.replace(/"/g, "") || "transactions.zip"

      // Create a blob from the response
      const blob = await response.blob()

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Export failed:", error)
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Export {total} Transaction{total !== 1 ? "s" : ""}
          </DialogTitle>
          <DialogDescription>Export selected transactions and files as a CSV file or a ZIP archive</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            {exportFilters.search && (
              <div className="flex flex-row items-center gap-2">
                <span className="text-sm font-medium">Search query:</span>
                <span className="text-sm">{exportFilters.search}</span>
              </div>
            )}

            <div className="flex flex-row items-center gap-2">
              <span className="text-sm font-medium">Time range:</span>

              <DateRangePicker
                defaultDate={{
                  from: exportFilters?.dateFrom ? new Date(exportFilters.dateFrom) : undefined,
                  to: exportFilters?.dateTo ? new Date(exportFilters.dateTo) : undefined,
                }}
                defaultRange="all-time"
                onChange={(date) => {
                  setExportFilters({
                    ...exportFilters,
                    dateFrom: date?.from ? formatDate(date.from, "yyyy-MM-dd") : undefined,
                    dateTo: date?.to ? formatDate(date.to, "yyyy-MM-dd") : undefined,
                  })
                }}
              />
            </div>

            <div className="flex flex-row items-center gap-2">
              <FormSelectCategory
                title="Category"
                name="category"
                categories={categories}
                value={exportFilters.categoryCode}
                onValueChange={(value) => setExportFilters({ ...exportFilters, categoryCode: value })}
                placeholder="All Categories"
                emptyValue="All Categories"
              />

              <FormSelectProject
                title="Project"
                name="project"
                projects={projects}
                value={exportFilters.projectCode}
                onValueChange={(value) => setExportFilters({ ...exportFilters, projectCode: value })}
                placeholder="All Projects"
                emptyValue="All Projects"
              />
            </div>
          </div>

          <Separator />

          <div className="text-lg font-bold">Fields to be included in CSV</div>

          <div className="grid grid-cols-2 gap-2">
            {fields.map((field) => (
              <div key={field.code} className="inline-flex gap-2">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    name={field.code}
                    checked={exportFields.includes(field.code)}
                    onChange={(e) =>
                      setExportFields(
                        e.target.checked ? [...exportFields, field.code] : exportFields.filter((f) => f !== field.code)
                      )
                    }
                  />
                  <span>{field.name}</span>
                </label>
              </div>
            ))}
          </div>
          <Separator />
          <div>
            <label className="flex items-center gap-3 text-lg">
              <input
                type="checkbox"
                name="attachments"
                className="h-[20px] w-[20px]"
                checked={includeAttachments}
                onChange={(e) => setIncludeAttachments(e.target.checked)}
              />
              <span className="flex flex-col">
                <span className="font-medium">Include attached files</span>
                <span className="text-sm">(create a zip archive)</span>
              </span>
            </label>
          </div>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Exporting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Export Transactions</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
