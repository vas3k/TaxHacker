"use client"

import { BulkActionsMenu } from "@/components/transactions/bulk-actions"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { parseFilesArray } from "@/lib/db-compat"
import { calcNetTotalPerCurrency, calcTotalPerCurrency, isTransactionIncomplete } from "@/lib/stats"
import { cn, formatCurrency } from "@/lib/utils"
import { Category, Field, Project, Transaction } from "@/prisma/client"
import { formatDate } from "date-fns"
import { ArrowDownIcon, ArrowUpIcon, File } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type FieldRenderer = {
  name: string
  code: string
  classes?: string
  sortable: boolean
  formatValue?: (transaction: Transaction & any) => React.ReactNode
  footerValue?: (transactions: Transaction[]) => React.ReactNode
}

type FieldWithRenderer = Field & {
  renderer: FieldRenderer
}

export const standardFieldRenderers: Record<string, FieldRenderer> = {
  name: {
    name: "Name",
    code: "name",
    classes: "font-medium min-w-[120px] max-w-[300px] overflow-hidden",
    sortable: true,
  },
  merchant: {
    name: "Merchant",
    code: "merchant",
    classes: "min-w-[120px] max-w-[250px] overflow-hidden",
    sortable: true,
  },
  issuedAt: {
    name: "Date",
    code: "issuedAt",
    classes: "min-w-[100px]",
    sortable: true,
    formatValue: (transaction: Transaction) =>
      transaction.issuedAt ? formatDate(transaction.issuedAt, "yyyy-MM-dd") : "",
  },
  projectCode: {
    name: "Project",
    code: "projectCode",
    sortable: true,
    formatValue: (transaction: Transaction & { project: Project }) =>
      transaction.projectCode ? (
        <Badge className="whitespace-nowrap" style={{ backgroundColor: transaction.project?.color }}>
          {transaction.project?.name || ""}
        </Badge>
      ) : (
        "-"
      ),
  },
  categoryCode: {
    name: "Category",
    code: "categoryCode",
    sortable: true,
    formatValue: (transaction: Transaction & { category: Category }) =>
      transaction.categoryCode ? (
        <Badge className="whitespace-nowrap" style={{ backgroundColor: transaction.category?.color }}>
          {transaction.category?.name || ""}
        </Badge>
      ) : (
        "-"
      ),
  },
  files: {
    name: "Files",
    code: "files",
    sortable: false,
    formatValue: (transaction: Transaction) => (
      <div className="flex items-center gap-2 text-sm">
        <File className="w-4 h-4" />
        {parseFilesArray(transaction.files).length}
      </div>
    ),
  },
  total: {
    name: "Total",
    code: "total",
    classes: "text-right",
    sortable: true,
    formatValue: (transaction: Transaction) => (
      <div className="text-right text-lg">
        <div
          className={cn(
            { income: "text-green-500", expense: "text-red-500", other: "text-black" }[transaction.type || "other"],
            "flex flex-col justify-end"
          )}
        >
          <span>
            {transaction.total && transaction.currencyCode
              ? formatCurrency(transaction.total, transaction.currencyCode)
              : transaction.total}
          </span>
          {transaction.convertedTotal &&
            transaction.convertedCurrencyCode &&
            transaction.convertedCurrencyCode !== transaction.currencyCode && (
              <span className="text-sm -mt-1">
                ({formatCurrency(transaction.convertedTotal, transaction.convertedCurrencyCode)})
              </span>
            )}
        </div>
      </div>
    ),
    footerValue: (transactions: Transaction[]) => {
      const netTotalPerCurrency = calcNetTotalPerCurrency(transactions)
      const turnoverPerCurrency = calcTotalPerCurrency(transactions)

      return (
        <div className="flex flex-col gap-3 text-right">
          <dl className="space-y-1">
            <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Net Total</dt>
            {Object.entries(netTotalPerCurrency).map(([currency, total]) => (
              <dd
                key={`net-${currency}`}
                className={cn("text-sm first:text-base font-medium", total >= 0 ? "text-green-600" : "text-red-600")}
              >
                {formatCurrency(total, currency)}
              </dd>
            ))}
          </dl>
          <dl className="space-y-1">
            <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Turnover</dt>
            {Object.entries(turnoverPerCurrency).map(([currency, total]) => (
              <dd key={`turnover-${currency}`} className="text-sm text-muted-foreground">
                {formatCurrency(total, currency)}
              </dd>
            ))}
          </dl>
        </div>
      )
    },
  },
  convertedTotal: {
    name: "Converted Total",
    code: "convertedTotal",
    classes: "text-right",
    sortable: true,
    formatValue: (transaction: Transaction) => (
      <div
        className={cn(
          { income: "text-green-500", expense: "text-red-500", other: "text-black" }[transaction.type || "other"],
          "flex flex-col justify-end text-right text-lg"
        )}
      >
        {transaction.convertedTotal && transaction.convertedCurrencyCode
          ? formatCurrency(transaction.convertedTotal, transaction.convertedCurrencyCode)
          : transaction.convertedTotal}
      </div>
    ),
  },
  currencyCode: {
    name: "Currency",
    code: "currencyCode",
    classes: "text-right",
    sortable: true,
  },
}

const getFieldRenderer = (field: Field): FieldRenderer => {
  if (standardFieldRenderers[field.code as keyof typeof standardFieldRenderers]) {
    return standardFieldRenderers[field.code as keyof typeof standardFieldRenderers]
  } else {
    return {
      name: field.name,
      code: field.code,
      classes: "",
      sortable: false,
    }
  }
}

export function TransactionList({ transactions, fields = [] }: { transactions: Transaction[]; fields?: Field[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [sorting, setSorting] = useState<{ field: string | null; direction: "asc" | "desc" | null }>(() => {
    const ordering = searchParams.get("ordering")
    if (!ordering) return { field: null, direction: null }
    const isDesc = ordering.startsWith("-")
    return {
      field: isDesc ? ordering.slice(1) : ordering,
      direction: isDesc ? "desc" : "asc",
    }
  })

  const visibleFields = useMemo(
    (): FieldWithRenderer[] =>
      fields
        .filter((field) => field.isVisibleInList)
        .map((field) => ({
          ...field,
          renderer: getFieldRenderer(field),
        })),
    [fields]
  )

  const toggleAllRows = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([])
      setLastSelectedIndex(null)
    } else {
      setSelectedIds(transactions.map((transaction) => transaction.id))
      setLastSelectedIndex(null)
    }
  }

  const toggleOneRow = (e: React.MouseEvent, id: string, index: number) => {
    e.stopPropagation()

    // SHIFT+click for range selection
    if (e.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      const rangeIds = transactions.slice(start, end + 1).map((t) => t.id)

      // Add all items in range to selection (union with existing selection)
      const newSelection = [...new Set([...selectedIds, ...rangeIds])]
      setSelectedIds(newSelection)
    } else {
      // Normal toggle behavior
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter((item) => item !== id))
      } else {
        setSelectedIds([...selectedIds, id])
      }
      setLastSelectedIndex(index)
    }
  }

  const handleRowClick = (id: string) => {
    router.push(`/transactions/${id}`)
  }

  const handleSort = (field: string) => {
    let newDirection: "asc" | "desc" | null = "asc"

    if (sorting.field === field) {
      if (sorting.direction === "asc") newDirection = "desc"
      else if (sorting.direction === "desc") newDirection = null
    }

    setSorting({
      field: newDirection ? field : null,
      direction: newDirection,
    })
  }

  const renderFieldInTable = (transaction: Transaction, field: FieldWithRenderer): string | React.ReactNode => {
    if (field.isExtra) {
      const extra = typeof transaction.extra === "string"
        ? JSON.parse(transaction.extra || "{}")
        : (transaction.extra || {})
      return extra[field.code] ?? ""
    } else if (field.renderer.formatValue) {
      return field.renderer.formatValue(transaction)
    } else {
      return String(transaction[field.code as keyof Transaction])
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (sorting.field && sorting.direction) {
      const ordering = sorting.direction === "desc" ? `-${sorting.field}` : sorting.field
      params.set("ordering", ordering)
    } else {
      params.delete("ordering")
    }
    router.push(`/transactions?${params.toString()}`)
  }, [sorting])

  const getSortIcon = (field: string) => {
    if (sorting.field !== field) return null
    return sorting.direction === "asc" ? (
      <ArrowUpIcon className="w-4 h-4 ml-1 inline" />
    ) : sorting.direction === "desc" ? (
      <ArrowDownIcon className="w-4 h-4 ml-1 inline" />
    ) : null
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[30px] select-none">
              <Checkbox checked={selectedIds.length === transactions.length} onCheckedChange={toggleAllRows} />
            </TableHead>
            {visibleFields.map((field) => (
              <TableHead
                key={field.code}
                className={cn(
                  field.renderer.classes,
                  field.renderer.sortable && "hover:cursor-pointer hover:bg-accent select-none"
                )}
                onClick={() => field.renderer.sortable && handleSort(field.code)}
              >
                {field.name || field.renderer.name}
                {field.renderer.sortable && getSortIcon(field.code)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction, index) => (
            <TableRow
              key={transaction.id}
              className={cn(
                isTransactionIncomplete(fields, transaction) && "bg-yellow-50",
                selectedIds.includes(transaction.id) && "bg-muted",
                "cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => handleRowClick(transaction.id)}
            >
              <TableCell onClick={(e) => toggleOneRow(e, transaction.id, index)}>
                <Checkbox
                  checked={selectedIds.includes(transaction.id)}
                  onCheckedChange={() => {}}
                />
              </TableCell>
              {visibleFields.map((field) => (
                <TableCell key={field.code} className={field.renderer.classes}>
                  {renderFieldInTable(transaction, field)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell></TableCell>
            {visibleFields.map((field) => (
              <TableCell key={field.code} className={field.renderer.classes}>
                {field.renderer.footerValue ? field.renderer.footerValue(transactions) : ""}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
      {selectedIds.length > 0 && (
        <BulkActionsMenu selectedIds={selectedIds} onActionComplete={() => setSelectedIds([])} />
      )}
    </div>
  )
}
