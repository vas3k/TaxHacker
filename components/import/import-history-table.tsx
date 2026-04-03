"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckedState } from "@radix-ui/react-checkbox"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { deleteImportBatchesAction } from "@/app/(app)/import/history/[batchId]/actions"
import { DeleteImportBatchButton } from "@/components/import/delete-batch-button"
import { SourceBadge } from "@/components/import/source-badge"
import { CSVFormat } from "@/lib/csv/format-detector"
import { CheckCircle2, Clock, Eye, Flag, PlusCircle, Trash2, XCircle } from "lucide-react"
import { formatDate } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const STATUS_META = {
  completed: {
    label: "Completed",
    className: "text-green-600",
    icon: CheckCircle2,
  },
  processing: {
    label: "Processing",
    className: "text-blue-600",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    className: "text-red-600",
    icon: XCircle,
  },
} as const

type ImportBatchSummary = {
  id: string
  filename: string
  status: "completed" | "processing" | "failed" | string
  totalRows: number
  matchedCount: number
  createdCount: number
  skippedCount: number
  errorCount: number
  createdAt: string | Date | null
  metadata?: unknown
}

export function ImportHistoryTable({ batches }: { batches: ImportBatchSummary[] }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => batches.some((batch) => batch.id === id)))
  }, [batches])

  const allSelected = selectedIds.length > 0 && selectedIds.length === batches.length
  const headerCheckboxState: CheckedState = allSelected
    ? true
    : selectedIds.length > 0
      ? "indeterminate"
      : false

  const toggleSelectAll = (checked: CheckedState) => {
    if (checked === "indeterminate") return
    if (checked) {
      setSelectedIds(batches.map((batch) => batch.id))
    } else {
      setSelectedIds([])
    }
  }

  const toggleSelectOne = (batchId: string, checked: CheckedState) => {
    if (checked === "indeterminate") return
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(batchId)) {
          return prev
        }
        return [...prev, batchId]
      } else {
        return prev.filter((id) => id !== batchId)
      }
    })
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    const confirmed = window.confirm(
      `Delete ${selectedIds.length} import${selectedIds.length > 1 ? "s" : ""}? This removes all related transactions.`
    )
    if (!confirmed) return

    startTransition(async () => {
      const result = await deleteImportBatchesAction(selectedIds)
      if (result?.success) {
        toast.success(`Deleted ${selectedIds.length} import${selectedIds.length > 1 ? "s" : ""}`)
        setSelectedIds([])
        router.refresh()
      } else {
        toast.error(result?.error || "Failed to delete imports")
      }
    })
  }

  if (batches.length === 0) {
    return null
  }

  return (
    <div className="rounded-md border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {selectedIds.length > 0
            ? `${selectedIds.length} selected`
            : "Select imports to delete multiple at once"}
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleBulkDelete}
          disabled={selectedIds.length === 0 || isPending}
        >
          <Trash2 className="h-4 w-4" />
          {isPending ? "Deleting..." : "Delete Selected"}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox checked={headerCheckboxState} onCheckedChange={toggleSelectAll} aria-label="Select all" />
            </TableHead>
            <TableHead className="min-w-[200px]">Filename</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Total Rows</TableHead>
            <TableHead className="text-center">
              <CheckCircle2 className="h-4 w-4 inline text-green-600" /> Merged
            </TableHead>
            <TableHead className="text-center">
              <PlusCircle className="h-4 w-4 inline text-blue-600" /> Created
            </TableHead>
            <TableHead className="text-center">
              <Flag className="h-4 w-4 inline text-yellow-600" /> Flagged
            </TableHead>
            <TableHead className="text-center">
              <XCircle className="h-4 w-4 inline text-red-600" /> Errors
            </TableHead>
            <TableHead>Imported At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => {
            const statusMeta = STATUS_META[batch.status as keyof typeof STATUS_META]
            const StatusIcon = statusMeta?.icon
            const createdAt = batch.createdAt ? new Date(batch.createdAt) : null
            const format = (batch.metadata as any)?.format as CSVFormat | undefined

            return (
              <TableRow
                key={batch.id}
                className={cn(
                  "hover:bg-muted/50",
                  selectedIds.includes(batch.id) && "bg-muted transition-colors"
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(batch.id)}
                    onCheckedChange={(checked) => toggleSelectOne(batch.id, checked)}
                    aria-label={`Select ${batch.filename}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {format && <SourceBadge format={format} size="sm" showLabel={false} />}
                    <span>{batch.filename}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {statusMeta ? (
                    <span className={cn("inline-flex items-center gap-1", statusMeta.className)}>
                      {StatusIcon && <StatusIcon className="h-4 w-4" />}
                      {statusMeta.label}
                    </span>
                  ) : (
                    batch.status
                  )}
                </TableCell>
                <TableCell className="text-center">{batch.totalRows}</TableCell>
                <TableCell className="text-center text-green-600">{batch.matchedCount}</TableCell>
                <TableCell className="text-center text-blue-600">{batch.createdCount}</TableCell>
                <TableCell className="text-center text-yellow-600">{batch.skippedCount}</TableCell>
                <TableCell className="text-center text-red-600">{batch.errorCount}</TableCell>
                <TableCell>{createdAt ? formatDate(createdAt, "yyyy-MM-dd HH:mm") : "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/import/history/${batch.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    <DeleteImportBatchButton batchId={batch.id} filename={batch.filename} />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
