"use client"

import { BulkActionsMenu } from "@/components/transactions/bulk-actions"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { calcNetTotalPerCurrency, calcTotalPerCurrency, isTransactionIncomplete } from "@/lib/stats"
import { cn, formatCurrency } from "@/lib/utils"
import { Category, Field, Project, Transaction } from "@/prisma/client"
import { formatDate } from "date-fns"
import { ArrowDownIcon, ArrowUpIcon, File, Flag, GitMerge, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { MatchedSourceBadges } from "@/components/import/matched-source-badges"
import { SourceBadge } from "@/components/import/source-badge"
import { CSVFormat } from "@/lib/csv/format-detector"

type FieldRenderer = {
  name: string
  code: string
  classes?: string
  sortable: boolean
  formatValue?: (
    transaction: Transaction & any,
    onMatchClick?: (transactionId: string, match?: any) => void
  ) => React.ReactNode
  footerValue?: (transactions: Transaction[]) => React.ReactNode
}

type FieldWithRenderer = Field & {
  renderer: FieldRenderer
}

export const standardFieldRenderers: Record<string, FieldRenderer> = {
  id: {
    name: "ID",
    code: "id",
    classes: "font-mono text-xs min-w-[280px] max-w-[280px] overflow-hidden",
    sortable: false,
    formatValue: (transaction: Transaction) => (
      <div className="text-xs font-mono text-muted-foreground truncate" title={transaction.id}>
        {transaction.id}
      </div>
    ),
  },
  import_source: {
    name: "Import Source",
    code: "import_source",
    classes: "min-w-[80px]",
    sortable: false,
    formatValue: (transaction: Transaction & { auditLogs?: any[] }) => {
      const auditLogs = transaction.auditLogs || []
      const formats = new Set<CSVFormat>()

      // Extract unique formats from audit logs
      for (const log of auditLogs) {
        if (log.action === 'created' && log.metadata?.format) {
          formats.add(log.metadata.format as CSVFormat)
        }
      }

      if (formats.size === 0) return null

      const formatLogos: Record<CSVFormat, string | null> = {
        amazon: "/logos/amazon.png",
        amex: "/logos/amex.png",
        chase: "/logos/chase.png",
        generic: null
      }

      return (
        <div className="flex gap-2 flex-wrap items-center">
          {Array.from(formats).map((format) => {
            const logo = formatLogos[format]
            if (!logo) return null
            return (
              <Image
                key={format}
                src={logo}
                alt={format}
                width={32}
                height={32}
                className="object-contain"
              />
            )
          })}
        </div>
      )
    },
  },
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
        {(transaction.files as string[]).length}
      </div>
    ),
  },
  matches: {
    name: "Matched",
    code: "matches",
    sortable: false,
    formatValue: (
      transaction: Transaction & { matches?: any[] },
      onMatchClick?: (transactionId: string, match?: any) => void
    ) => {
      const matchCount = transaction.matches?.length || 0
      if (matchCount === 0) return null

      const hasFlaggedMatch = transaction.matches?.some((match) => match.status === "flagged")
      const firstFlaggedMatch = transaction.matches?.find((match) => match.status === "flagged")

      // Get the most recent match format for the badge
      const latestMatch = transaction.matches?.[transaction.matches.length - 1]
      const latestFormat = latestMatch?.batch?.metadata?.format as CSVFormat | undefined

      // Get the original (first) match format
      const firstMatch = transaction.matches?.[0]
      const originalFormat = firstMatch?.batch?.metadata?.format as CSVFormat | undefined

      // Build detailed tooltip content
      const tooltipLines = transaction.matches?.map((match: any) => {
        const statusEmojiMap: Record<string, string> = {
          'auto_merged': '✓',
          'reviewed_merged': '✓',
          'flagged': '⚠',
          'reviewed_rejected': '✗'
        }
        const statusEmoji = statusEmojiMap[match.status] || '•'

        const statusTextMap: Record<string, string> = {
          'auto_merged': 'Auto-merged',
          'reviewed_merged': 'Reviewed',
          'flagged': 'Needs review',
          'reviewed_rejected': 'Rejected'
        }
        const statusText = statusTextMap[match.status] || match.status

        const filename = match.batch?.filename || 'Unknown file'
        const confidence = match.confidence ? ` (${match.confidence}%)` : ''
        const date = match.createdAt ? formatDate(match.createdAt, "MMM d, yyyy") : ''

        return `${statusEmoji} ${filename}\n   ${statusText}${confidence} • ${date}`
      }) || []

      const tooltipText = tooltipLines.join('\n')
      const badgeText = hasFlaggedMatch ? "Needs review" : matchCount > 1 ? `${matchCount}x` : "Matched"

      return (
        <div className="relative group">
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer flex items-center gap-1.5",
              hasFlaggedMatch ? "border-yellow-400 text-yellow-700 bg-yellow-50" : "hover:bg-blue-50"
            )}
            onClick={(e) => {
              e.stopPropagation()
              if (onMatchClick) {
                onMatchClick(transaction.id, hasFlaggedMatch ? firstFlaggedMatch : undefined)
              }
            }}
          >
            <MatchedSourceBadges
              csvFormat={latestFormat}
              transactionOriginalFormat={originalFormat}
            />
            {hasFlaggedMatch ? <Flag className="w-3 h-3" /> : <GitMerge className="w-3 h-3" />}
            {badgeText}
          </Badge>

          {/* Hover tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-pre-line max-w-xs shadow-lg">
              {tooltipText}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )
    },
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

      // Isolate only the income to calculate accurate turnover and then Calculate the final turnover.
      const turnoverPerCurrency = calcTotalPerCurrency(transactions.filter((transaction) => transaction.type === 'income'))

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
  const [showMatchesModal, setShowMatchesModal] = useState<string | null>(null)
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
    } else {
      setSelectedIds(transactions.map((transaction) => transaction.id))
    }
  }

  const toggleOneRow = (e: React.MouseEvent, id: string) => {
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

  const renderFieldInTable = (transaction: Transaction, field: FieldWithRenderer): string | React.ReactNode => {
    if (field.isExtra) {
      return transaction.extra?.[field.code as keyof typeof transaction.extra] ?? ""
    } else if (field.renderer.formatValue) {
      // Special handling for matches field to pass the click handler
      if (field.code === "matches") {
        return field.renderer.formatValue(transaction, (transactionId, match) => {
          if (match?.status === "flagged" && match.batchId) {
            router.push(`/import/history/${match.batchId}/review`)
          } else {
            setShowMatchesModal(transactionId)
          }
        })
      }
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
          {transactions.map((transaction) => (
            <TableRow
              key={transaction.id}
              className={cn(
                isTransactionIncomplete(fields, transaction) && "bg-yellow-50",
                selectedIds.includes(transaction.id) && "bg-muted",
                "cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => handleRowClick(transaction.id)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.includes(transaction.id)}
                  onCheckedChange={(checked) => {
                    if (checked !== "indeterminate") {
                      toggleOneRow({ stopPropagation: () => {} } as React.MouseEvent, transaction.id)
                    }
                  }}
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

      {/* Match History Modal */}
      {showMatchesModal && (() => {
        const transaction = transactions.find(t => t.id === showMatchesModal)
        if (!transaction) return null

        const matches = (transaction as any).matches || []

        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowMatchesModal(null)}>
            <div
              className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-auto m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Import Match History</h3>
                  <p className="text-sm text-muted-foreground">{transaction.name || transaction.description || 'Untitled'}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowMatchesModal(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4 space-y-3">
                {matches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No import matches found for this transaction.</p>
                ) : (
                  matches.map((match: any) => (
                    <div key={match.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Import Match</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(match.createdAt, "PPpp")}
                          </p>
                        </div>
                        <Badge className={
                          match.status === 'auto_merged' ? 'bg-green-600' :
                          match.status === 'reviewed_merged' ? 'bg-blue-600' :
                          match.status === 'reviewed_rejected' ? 'bg-red-600' :
                          'bg-yellow-600'
                        }>
                          {match.status === 'auto_merged' ? 'Auto-Merged' :
                           match.status === 'reviewed_merged' ? 'Reviewed & Merged' :
                           match.status === 'reviewed_rejected' ? 'Rejected' :
                           'Flagged'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className="ml-2 font-medium">{match.confidence}%</span>
                        </div>
                        <div>
                          <Link
                            href={`/import/history/${match.batchId}`}
                            className="text-blue-600 hover:underline"
                            onClick={() => setShowMatchesModal(null)}
                          >
                            View Import Batch →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {selectedIds.length > 0 && (
        <BulkActionsMenu selectedIds={selectedIds} onActionComplete={() => setSelectedIds([])} />
      )}
    </div>
  )
}
