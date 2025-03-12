"use client"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { calcTotalPerCurrency } from "@/lib/stats"
import { cn, formatCurrency } from "@/lib/utils"
import { Category, Project, Transaction } from "@prisma/client"
import { formatDate } from "date-fns"
import { ArrowDownIcon, ArrowUpIcon, File } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export const transactionsTable = [
  {
    name: "Name",
    db: "name",
    classes: "font-medium max-w-[300px] min-w-[120px] overflow-hidden",
    sortable: true,
  },
  {
    name: "Merchant",
    db: "merchant",
    classes: "max-w-[200px] max-h-[20px]  min-w-[120px] overflow-hidden",
    sortable: true,
  },
  {
    name: "Date",
    db: "issuedAt",
    classes: "min-w-[100px]",
    format: (transaction: Transaction) => (transaction.issuedAt ? formatDate(transaction.issuedAt, "yyyy-MM-dd") : ""),
    sortable: true,
  },
  {
    name: "Project",
    db: "projectCode",
    format: (transaction: Transaction & { project: Project }) =>
      transaction.projectCode ? (
        <Badge className="whitespace-nowrap" style={{ backgroundColor: transaction.project?.color }}>
          {transaction.project?.name || ""}
        </Badge>
      ) : (
        "-"
      ),
    sortable: true,
  },
  {
    name: "Category",
    db: "categoryCode",
    format: (transaction: Transaction & { category: Category }) =>
      transaction.categoryCode ? (
        <Badge className="whitespace-nowrap" style={{ backgroundColor: transaction.category?.color }}>
          {transaction.category?.name || ""}
        </Badge>
      ) : (
        "-"
      ),
    sortable: true,
  },
  {
    name: "Files",
    db: "files",
    format: (transaction: Transaction) => (
      <div className="flex items-center gap-2 text-sm">
        <File className="w-4 h-4" />
        {(transaction.files as string[]).length}
      </div>
    ),
    sortable: false,
  },
  {
    name: "Total",
    db: "total",
    classes: "text-right",
    format: (transaction: Transaction) => (
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
    sortable: true,
    footer: (transactions: Transaction[]) => {
      const totalPerCurrency = calcTotalPerCurrency(transactions)
      return (
        <div className="flex flex-col">
          {Object.entries(totalPerCurrency).map(([currency, total]) => (
            <div key={currency} className="text-sm first:text-base">
              {formatCurrency(total, currency)}
            </div>
          ))}
        </div>
      )
    },
  },
]

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
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

  const toggleAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(transactions.map((transaction) => transaction.id))
    }
  }

  const toggleOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
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
            <TableHead className="w-[50px] select-none">
              <Checkbox checked={selectedIds.length === transactions.length} onCheckedChange={toggleAll} />
            </TableHead>
            {transactionsTable.map((field) => (
              <TableHead
                key={field.db}
                className={cn(field.classes, field.sortable && "hover:cursor-pointer hover:bg-accent select-none")}
                onClick={() => field.sortable && handleSort(field.db)}
              >
                {field.name}
                {field.sortable && getSortIcon(field.db)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction: any) => (
            <TableRow
              key={transaction.id}
              className={cn(selectedIds.includes(transaction.id) && "bg-muted", "cursor-pointer hover:bg-muted/50")}
              onClick={() => handleRowClick(transaction.id)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.includes(transaction.id)}
                  onCheckedChange={(checked) => {
                    if (checked !== "indeterminate") {
                      toggleOne({ stopPropagation: () => {} } as React.MouseEvent, transaction.id)
                    }
                  }}
                />
              </TableCell>
              {transactionsTable.map((field) => (
                <TableCell key={field.db} className={field.classes}>
                  {field.format ? field.format(transaction) : transaction[field.db]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell></TableCell>
            {transactionsTable.map((field) => (
              <TableCell key={field.db} className={field.classes}>
                {field.footer ? field.footer(transactions) : ""}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
