import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { getImportBatchById } from "@/models/import-batches"
import {
  getTransactionMatchesByBatch,
  countFlaggedMatches,
  type TransactionMatchWithTransaction,
} from "@/models/transaction-matches"
import { getImportRowsByBatch } from "@/models/import-rows"
import { getTransactionsByIds } from "@/models/transactions"
import { CheckCircle2, Flag, PlusCircle, XCircle, ArrowLeft, FileEdit, AlertCircle, Eye } from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { differenceInCalendarDays, formatDate } from "date-fns"
import { formatCurrency, formatCurrencyUnits } from "@/lib/utils"
import { extractCsvAmountInUnits } from "@/lib/csv/utils"
import { BatchReviewWrapper } from "@/components/import/batch-review-wrapper"
import { DeleteImportBatchButton } from "@/components/import/delete-batch-button"
import { SourceBadge } from "@/components/import/source-badge"
import { CSVFormat } from "@/lib/csv/format-detector"

export const metadata: Metadata = {
  title: "Import Batch Details",
  description: "View detailed import batch results",
}

type ImportRowForView = Awaited<ReturnType<typeof getImportRowsByBatch>>[number]
type CreatedTransaction = Awaited<ReturnType<typeof getTransactionsByIds>>[number]

const getMatchedAmountDisplay = (match: TransactionMatchWithTransaction) => {
  const currency = match.transaction.currencyCode ?? match.transaction.convertedCurrencyCode ?? "USD"
  const csvAmount = extractCsvAmountInUnits(match.csvData)
  if (csvAmount !== null) {
    return formatCurrencyUnits(csvAmount, currency)
  }
  return formatCurrency(match.matchedAmount, currency)
}

const csvDateCandidates = [
  "issuedAt",
  "date",
  "Date",
  "transactionDate",
  "Transaction Date",
  "postedDate",
  "Posted Date",
]

const parseDateLikeValue = (value: unknown): Date | null => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === "number") {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

const extractDateFromRecord = (data: unknown): Date | null => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null
  }

  const record = data as Record<string, unknown>
  for (const key of csvDateCandidates) {
    if (!(key in record)) continue
    const parsed = parseDateLikeValue(record[key])
    if (parsed) {
      return parsed
    }
  }
  return null
}

const getCreatedRowCsvDate = (row: ImportRowForView, transaction?: CreatedTransaction): Date | null => {
  return (
    extractDateFromRecord(row.parsedData) ??
    extractDateFromRecord(row.rawData) ??
    transaction?.issuedAt ??
    null
  )
}

const getCreatedRowAmountDisplay = (row: ImportRowForView, transaction?: CreatedTransaction) => {
  const currency = transaction?.currencyCode ?? transaction?.convertedCurrencyCode ?? "USD"
  if (typeof transaction?.total === "number") {
    return formatCurrency(transaction.total, currency)
  }

  const csvAmount = extractCsvAmountInUnits(row.rawData)
  if (csvAmount !== null) {
    return formatCurrencyUnits(csvAmount, currency)
  }

  return "-"
}

export default async function ImportBatchDetailsPage({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const { batchId } = await params
  const user = await getCurrentUser()

  const batch = await getImportBatchById(batchId, user.id)
  if (!batch) {
    notFound()
  }

  const allMatches = await getTransactionMatchesByBatch(batchId)
  const autoMergedMatches = allMatches.filter((m) => m.status === "auto_merged")
  const flaggedMatches = allMatches.filter((m) => m.status === "flagged")
  const reviewedMergedMatches = allMatches.filter((m) => m.status === "reviewed_merged")
  const reviewedRejectedMatches = allMatches.filter((m) => m.status === "reviewed_rejected")

  const importRows = await getImportRowsByBatch(batchId)
  const createdRows = importRows.filter((r) => r.status === "created")
  const errorRows = importRows.filter((r) => r.status === "error")
  const skippedRows = importRows.filter((r) => r.status === "skipped")

  const createdTransactionIds = Array.from(
    new Set(
      createdRows
        .map((row) => row.transactionId)
        .filter((transactionId): transactionId is string => Boolean(transactionId))
    )
  )
  const createdTransactions = await getTransactionsByIds(user.id, createdTransactionIds)
  const createdTransactionMap = new Map(createdTransactions.map((transaction) => [transaction.id, transaction]))

  const flaggedCount = await countFlaggedMatches(batchId)
  const format = (batch.metadata as any)?.format as CSVFormat | undefined

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <div className="flex flex-col gap-2">
          <Link href="/import/history">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {format && <SourceBadge format={format} size="lg" showLabel={true} />}
            <h2 className="text-3xl font-bold tracking-tight">{batch.filename}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Imported on {batch.createdAt ? formatDate(batch.createdAt, "PPpp") : "-"}
          </p>
        </div>
        <div className="flex gap-2">
          {flaggedCount > 0 && (
            <Link href={`/import/history/${batchId}/review`}>
              <Button>
                <FileEdit />
                Review {flaggedCount} Flagged Match{flaggedCount > 1 ? "es" : ""}
              </Button>
            </Link>
          )}
          <DeleteImportBatchButton batchId={batchId} filename={batch.filename} />
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/40 border-green-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Merged</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{batch.matchedCount}</div>
            <p className="text-xs text-muted-foreground">High confidence matches</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 border-blue-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created New</CardTitle>
            <PlusCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{batch.createdCount}</div>
            <p className="text-xs text-muted-foreground">New transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-yellow-50/30 to-amber-50/40 border-yellow-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <Flag className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{batch.skippedCount}</div>
            <p className="text-xs text-muted-foreground">Needs review</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-red-50/30 to-rose-50/40 border-red-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{batch.errorCount}</div>
            <p className="text-xs text-muted-foreground">Failed to process</p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Match Review Tables */}
      <BatchReviewWrapper
        autoMergedMatches={autoMergedMatches}
        flaggedMatches={flaggedMatches}
        reviewedMergedMatches={reviewedMergedMatches}
        reviewedRejectedMatches={reviewedRejectedMatches}
        batchFormat={format}
      />

      {/* Created Transactions */}
      {createdRows.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-blue-600" />
              Created Transactions ({createdRows.length})
            </CardTitle>
            <CardDescription>New transactions created from CSV rows with no matches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">Row #</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead className="text-center">Amount</TableHead>
                    <TableHead>CSV Date</TableHead>
                    <TableHead>DB Date</TableHead>
                    <TableHead className="text-center">Days Diff</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {createdRows.map((row) => {
                    const transaction = row.transactionId ? createdTransactionMap.get(row.transactionId) : undefined
                    const csvDate = getCreatedRowCsvDate(row, transaction)
                    const dbDate = transaction?.issuedAt ?? transaction?.createdAt ?? null
                    const daysDiff =
                      csvDate && dbDate ? Math.abs(differenceInCalendarDays(dbDate, csvDate)) : null

                    return (
                      <TableRow key={row.id}>
                        <TableCell className="text-center text-sm text-muted-foreground">{row.rowNumber}</TableCell>
                        <TableCell>
                          {transaction ? (
                            <>
                              <Link
                                href={`/transactions/${transaction.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {transaction.name || transaction.description || "View Transaction"}
                              </Link>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                                {transaction.projectCode && <span>Project: {transaction.projectCode}</span>}
                                {transaction.categoryCode && (
                                  <span>Category: {transaction.categoryCode}</span>
                                )}
                                <Badge className="bg-blue-600">Created</Badge>
                              </div>
                            </>
                          ) : row.transactionId ? (
                            <span className="text-muted-foreground">Transaction data unavailable</span>
                          ) : (
                            <span className="text-muted-foreground">Transaction not linked</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {getCreatedRowAmountDisplay(row, transaction)}
                        </TableCell>
                        <TableCell>{csvDate ? formatDate(csvDate, "yyyy-MM-dd") : "-"}</TableCell>
                        <TableCell>{dbDate ? formatDate(dbDate, "yyyy-MM-dd") : "-"}</TableCell>
                        <TableCell className="text-center">{daysDiff ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          {row.transactionId ? (
                            <Link href={`/transactions/${row.transactionId}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground text-sm">No transaction</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {errorRows.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Errors ({errorRows.length})
            </CardTitle>
            <CardDescription>Rows that failed to process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row #</TableHead>
                    <TableHead>Error Message</TableHead>
                    <TableHead>Raw Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell className="text-red-600">
                        <span className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {row.errorMessage || "Unknown error"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <details>
                          <summary className="cursor-pointer text-xs text-muted-foreground">View raw data</summary>
                          <pre className="text-xs mt-2 p-2 bg-gray-100 rounded">
                            {JSON.stringify(row.rawData, null, 2)}
                          </pre>
                        </details>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skipped Rows */}
      {skippedRows.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-600" />
              Skipped Rows ({skippedRows.length})
            </CardTitle>
            <CardDescription>Rows that were skipped during processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row #</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skippedRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.errorMessage || "Already matched in this batch"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
