"use client"

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
import { TransactionFilters } from "@/data/transactions"
import { Category, Field, Project } from "@prisma/client"
import { formatDate } from "date-fns"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { DateRangePicker } from "../forms/date-range-picker"
import { FormSelectCategory } from "../forms/select-category"
import { FormSelectProject } from "../forms/select-project"

const deselectedFields = ["files", "text"]

export function ExportTransactionsDialog({
  filters,
  fields,
  categories,
  projects,
  children,
}: {
  filters: TransactionFilters
  fields: Field[]
  categories: Category[]
  projects: Project[]
  children: React.ReactNode
}) {
  const router = useRouter()
  const [exportFilters, setExportFilters] = useState<TransactionFilters>(filters)
  const [exportFields, setExportFields] = useState<string[]>(
    fields.map((field) => (deselectedFields.includes(field.code) ? "" : field.code))
  )
  const [includeAttachments, setIncludeAttachments] = useState(true)

  const handleSubmit = () => {
    router.push(
      `/export/transactions?${new URLSearchParams({
        ...exportFilters,
        fields: exportFields.join(","),
        includeAttachments: includeAttachments.toString(),
      }).toString()}`
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Export Transactions</DialogTitle>
          <DialogDescription>Export selected transactions and files as a CSV file or a ZIP archive</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            {filters.search && (
              <div className="flex flex-row items-center gap-2">
                <span className="text-sm font-medium">Search query:</span>
                <span className="text-sm">{filters.search}</span>
              </div>
            )}

            <div className="flex flex-row items-center gap-2">
              <span className="text-sm font-medium">Time range:</span>

              <DateRangePicker
                defaultDate={{
                  from: filters?.dateFrom ? new Date(filters.dateFrom) : undefined,
                  to: filters?.dateTo ? new Date(filters.dateTo) : undefined,
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
          <Button type="button" onClick={handleSubmit}>
            Export Transactions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
