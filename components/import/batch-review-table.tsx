"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "date-fns"
import { cn, formatCurrency, formatCurrencyUnits } from "@/lib/utils"
import { extractCsvAmountInUnits } from "@/lib/csv/utils"
import { MatchDetailComparison } from "./match-detail-comparison"
import { MatchedSourceBadges } from "./matched-source-badges"
import { CSVFormat } from "@/lib/csv/format-detector"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  Eye,
  History,
  X,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"

type TransactionMatch = {
  id: string
  transactionId: string
  confidence: number
  matchedAmount: number
  matchedDate: Date
  existingDate: Date
  daysDifference: number
  status: string
  csvData: unknown
  mergedFields: unknown
  reviewedBy: string | null
  reviewedAt: Date | null
  createdAt: Date
  transaction: {
    id: string
    name: string | null
    description: string | null
    merchant: string | null
    total: number | null
    currencyCode: string | null
    convertedCurrencyCode: string | null
    issuedAt: Date | null
    projectCode: string | null
    categoryCode: string | null
    createdAt: Date
    updatedAt: Date
  }
}

type SortField = 'confidence' | 'amount' | 'matchedDate' | 'existingDate' | 'daysDifference'
type SortDirection = 'asc' | 'desc'

type BatchReviewTableProps = {
  matches: TransactionMatch[]
  title: string
  description?: string
  variant: 'auto-merged' | 'flagged' | 'reviewed-merged' | 'reviewed-rejected'
  onApprove?: (matchId: string) => void
  onReject?: (matchId: string) => void
  batchFormat?: CSVFormat
}

export function BatchReviewTable({
  matches,
  title,
  description,
  variant,
  onApprove,
  onReject,
  batchFormat,
}: BatchReviewTableProps) {
  const [sortField, setSortField] = useState<SortField>('confidence')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedMatch, setSelectedMatch] = useState<TransactionMatch | null>(null)
  const [showHistory, setShowHistory] = useState<string | null>(null)
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      let aValue: number | Date
      let bValue: number | Date

      switch (sortField) {
        case 'confidence':
          aValue = a.confidence
          bValue = b.confidence
          break
        case 'amount':
          aValue = a.matchedAmount
          bValue = b.matchedAmount
          break
        case 'matchedDate':
          aValue = new Date(a.matchedDate).getTime()
          bValue = new Date(b.matchedDate).getTime()
          break
        case 'existingDate':
          aValue = new Date(a.existingDate).getTime()
          bValue = new Date(b.existingDate).getTime()
          break
        case 'daysDifference':
          aValue = a.daysDifference
          bValue = b.daysDifference
          break
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [matches, sortField, sortDirection])

  const getMatchedAmountDisplay = (match: TransactionMatch) => {
    const currency = match.transaction.currencyCode ?? match.transaction.convertedCurrencyCode ?? "USD"
    const csvData = match.csvData as Record<string, unknown> | null
    const csvAmount = csvData ? extractCsvAmountInUnits(csvData) : null
    if (csvAmount !== null) {
      return formatCurrencyUnits(csvAmount, currency)
    }
    return formatCurrency(match.matchedAmount, currency)
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field
    return (
      <TableHead
        className="cursor-pointer hover:bg-muted/50 select-none"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-2">
          {children}
          {isActive ? (
            sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
          ) : (
            <ArrowUpDown className="h-4 w-4 opacity-30" />
          )}
        </div>
      </TableHead>
    )
  }

  const getBadgeColor = () => {
    switch (variant) {
      case 'auto-merged':
        return 'bg-green-600'
      case 'flagged':
        return 'bg-yellow-600'
      case 'reviewed-merged':
        return 'bg-blue-600'
      case 'reviewed-rejected':
        return 'bg-gray-600'
    }
  }

  const toggleSelectAll = () => {
    if (selectedMatchIds.length === matches.length) {
      setSelectedMatchIds([])
    } else {
      setSelectedMatchIds(matches.map(m => m.id))
    }
  }

  const toggleSelectOne = (matchId: string) => {
    if (selectedMatchIds.includes(matchId)) {
      setSelectedMatchIds(selectedMatchIds.filter(id => id !== matchId))
    } else {
      setSelectedMatchIds([...selectedMatchIds, matchId])
    }
  }

  const handleBulkApprove = async () => {
    if (!onApprove || selectedMatchIds.length === 0) return

    for (const matchId of selectedMatchIds) {
      onApprove(matchId)
    }
    setSelectedMatchIds([])
  }

  const handleBulkReject = async () => {
    if (!onReject || selectedMatchIds.length === 0) return

    for (const matchId of selectedMatchIds) {
      onReject(matchId)
    }
    setSelectedMatchIds([])
  }

  if (matches.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {selectedMatchIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedMatchIds.length} selected
            </span>
            {variant === 'flagged' && onApprove && onReject && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleBulkReject}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Selected
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleBulkApprove}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Selected
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedMatchIds.length === matches.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <SortableHeader field="confidence">Confidence</SortableHeader>
              <TableHead>Transaction</TableHead>
              <SortableHeader field="amount">Amount</SortableHeader>
              <SortableHeader field="matchedDate">CSV Date</SortableHeader>
              <SortableHeader field="existingDate">DB Date</SortableHeader>
              <SortableHeader field="daysDifference">Days Diff</SortableHeader>
              {variant === 'auto-merged' && <TableHead>Merged Fields</TableHead>}
              {(variant === 'reviewed-merged' || variant === 'reviewed-rejected') && (
                <TableHead>Reviewed At</TableHead>
              )}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMatches.map((match) => (
              <TableRow
                key={match.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/30",
                  selectedMatchIds.includes(match.id) && "bg-muted"
                )}
                onClick={(e) => {
                  // Don't open detail pane if clicking on buttons or checkbox
                  if ((e.target as HTMLElement).closest('button, input[type="checkbox"]')) return
                  setSelectedMatch(match)
                }}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedMatchIds.includes(match.id)}
                    onCheckedChange={() => toggleSelectOne(match.id)}
                  />
                </TableCell>
                <TableCell>
                  <Badge className={getBadgeColor()}>{match.confidence}%</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MatchedSourceBadges
                      csvFormat={batchFormat}
                      transactionOriginalFormat={
                        (match.transaction as any).matches?.[0]?.batch?.metadata?.format as CSVFormat | undefined
                      }
                    />
                    <Link
                      href={`/transactions/${match.transactionId}`}
                      className="text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {match.transaction.name || match.transaction.description || "View Transaction"}
                    </Link>
                  </div>
                  {match.transaction.projectCode && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Project: {match.transaction.projectCode}
                    </div>
                  )}
                </TableCell>
                <TableCell>{getMatchedAmountDisplay(match)}</TableCell>
                <TableCell>{formatDate(match.matchedDate, "yyyy-MM-dd")}</TableCell>
                <TableCell>{formatDate(match.existingDate, "yyyy-MM-dd")}</TableCell>
                <TableCell className="text-center">{match.daysDifference}</TableCell>
                {variant === 'auto-merged' && (
                  <TableCell>
                    {Array.isArray(match.mergedFields) && match.mergedFields.length > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {(match.mergedFields as string[]).join(", ")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </TableCell>
                )}
                {(variant === 'reviewed-merged' || variant === 'reviewed-rejected') && (
                  <TableCell>
                    {match.reviewedAt ? formatDate(match.reviewedAt, "yyyy-MM-dd HH:mm") : "-"}
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedMatch(match)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowHistory(match.transactionId)
                      }}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    {variant === 'flagged' && onApprove && onReject && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            onApprove(match.id)
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            onReject(match.id)
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Detail Pane Modal with Comparison View */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setSelectedMatch(null)}>
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Import Match Details</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedMatch.transaction.name || selectedMatch.transaction.description || 'Transaction'}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMatch(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <MatchDetailComparison match={selectedMatch} />
            </div>

            {/* Footer with Actions */}
            <div className="sticky bottom-0 bg-white border-t p-4 flex items-center justify-between">
              <Link
                href={`/transactions/${selectedMatch.transactionId}`}
                className="text-sm text-blue-600 hover:underline"
                onClick={() => setSelectedMatch(null)}
              >
                View Full Transaction →
              </Link>
              {variant === 'flagged' && onApprove && onReject && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      onReject(selectedMatch.id)
                      setSelectedMatch(null)
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      onApprove(selectedMatch.id)
                      setSelectedMatch(null)
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Merge
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Match History Modal (will be implemented next) */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowHistory(null)}>
          <div
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-lg overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Match History</h3>
                <Button variant="ghost" onClick={() => setShowHistory(null)}>Close</Button>
              </div>

              <p className="text-muted-foreground">
                Match history for transaction {showHistory} will be displayed here.
              </p>
              {/* Will implement match history component next */}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
