"use client"

import {
  approveMatchAction,
  rejectMatchAction,
  type ActionState,
} from "@/app/(app)/import/history/[batchId]/review/actions"
import { FormError } from "@/components/forms/error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatCurrencyUnits } from "@/lib/utils"
import { Category, Project, Transaction, TransactionMatch } from "@/prisma/client"
import { formatDate } from "date-fns"
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { extractCsvAmountInUnits } from "@/lib/csv/utils"
import { SourceBadge } from "@/components/import/source-badge"
import { CSVFormat } from "@/lib/csv/format-detector"

type MatchWithTransaction = TransactionMatch & {
  transaction: Transaction & {
    category: Category | null
    project: Project | null
  }
}

export function MatchReviewList({
  matches,
  batchId,
  format,
}: {
  matches: MatchWithTransaction[]
  batchId: string
  format?: CSVFormat
}) {
  const [processedMatches, setProcessedMatches] = useState<Set<string>>(new Set())

  return (
    <div className="space-y-6">
      {matches
        .filter((match) => !processedMatches.has(match.id))
        .map((match) => (
          <MatchReviewCard
            key={match.id}
            match={match}
            batchId={batchId}
            format={format}
            onProcessed={(matchId) => {
              setProcessedMatches((prev) => new Set([...prev, matchId]))
            }}
          />
        ))}

      {processedMatches.size === matches.length && (
        <div className="flex flex-col items-center justify-center gap-2 h-full min-h-[200px]">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <p className="text-lg font-medium">All matches reviewed!</p>
          <p className="text-sm text-muted-foreground">You've reviewed all flagged matches in this batch.</p>
        </div>
      )}
    </div>
  )
}

function MatchReviewCard({
  match,
  batchId,
  format,
  onProcessed,
}: {
  match: MatchWithTransaction
  batchId: string
  format?: CSVFormat
  onProcessed: (matchId: string) => void
}) {
  const [approveState, setApproveState] = useState<ActionState<{ matchId: string }>>(null)
  const [rejectState, setRejectState] = useState<ActionState<{ matchId: string }>>(null)
  const [isApproving, startApproveTransition] = useTransition()
  const [isRejecting, startRejectTransition] = useTransition()

  const csvData = match.csvData as Record<string, unknown>
  const safeString = (value: unknown) => (typeof value === "string" ? value : null)
  const csvName = safeString(csvData.name)
  const csvDescription = safeString(csvData.description)
  const csvMerchant = safeString(csvData.merchant)
  const csvImportReference = safeString(csvData.importReference)
  const currency = match.transaction.currencyCode ?? match.transaction.convertedCurrencyCode ?? "USD"
  const csvAmountUnits = extractCsvAmountInUnits(csvData)
  const csvAmountDisplay =
    csvAmountUnits !== null ? formatCurrencyUnits(csvAmountUnits, currency) : formatCurrency(match.matchedAmount, currency)

  const handleApprove = async () => {
    const formData = new FormData()
    formData.append("matchId", match.id)
    formData.append("batchId", batchId)

    startApproveTransition(async () => {
      const result = await approveMatchAction(null, formData)
      setApproveState(result)
      if (result?.success) {
        toast.success("Match approved and merged successfully")
        onProcessed(match.id)
      } else {
        toast.error(result?.error || "Failed to approve match")
      }
    })
  }

  const handleReject = async () => {
    const formData = new FormData()
    formData.append("matchId", match.id)
    formData.append("batchId", batchId)

    startRejectTransition(async () => {
      const result = await rejectMatchAction(null, formData)
      setRejectState(result)
      if (result?.success) {
        toast.success("Match rejected")
        onProcessed(match.id)
      } else {
        toast.error(result?.error || "Failed to reject match")
      }
    })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-yellow-600"
    if (confidence >= 70) return "bg-orange-600"
    return "bg-red-600"
  }

  return (
    <Card className="bg-gradient-to-br from-white via-yellow-50/20 to-amber-50/30 border-yellow-200/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Badge className={getConfidenceColor(match.confidence)}>{match.confidence}% Match</Badge>
            <span className="text-sm font-normal text-muted-foreground">
              {match.daysDifference === 0
                ? "Same day"
                : match.daysDifference === 1
                  ? "1 day apart"
                  : `${match.daysDifference} days apart`}
            </span>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={handleReject}
              disabled={isApproving || isRejecting}
              variant="outline"
              className="border-red-200 hover:bg-red-50"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="text-red-600" />
                  Reject
                </>
              )}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? (
                <>
                  <Loader2 className="animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 />
                  Approve & Merge
                </>
              )}
            </Button>
          </div>
        </div>
        <CardDescription>Review this potential duplicate and decide whether to merge</CardDescription>
      </CardHeader>
      <CardContent>
        {(approveState?.error || rejectState?.error) && (
          <FormError className="mb-4">{approveState?.error || rejectState?.error}</FormError>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* CSV Data */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              {format && <SourceBadge format={format} size="sm" showLabel={false} />}
              <h3 className="font-semibold text-sm uppercase tracking-wide text-blue-600">CSV Import Data</h3>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Date</span>
                <p className="font-medium">{formatDate(match.matchedDate, "PPP")}</p>
              </div>

              <div>
                <span className="text-xs font-medium text-muted-foreground">Amount</span>
                <p className="text-lg font-bold text-blue-600">{csvAmountDisplay}</p>
              </div>

              {csvName && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Name</span>
                  <p className="font-medium">{csvName}</p>
                </div>
              )}

              {csvDescription && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Description</span>
                  <p className="text-sm">{csvDescription}</p>
                </div>
              )}

              {csvMerchant && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Merchant</span>
                  <p className="text-sm">{csvMerchant}</p>
                </div>
              )}

              {csvImportReference && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Reference</span>
                  <p className="text-sm font-mono text-xs">{csvImportReference}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="h-8 w-8 text-muted-foreground" />
          </div>

          {/* Existing Transaction */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-green-600">
                Existing Transaction
              </h3>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Date</span>
                <p className="font-medium">
                  {match.transaction.issuedAt ? formatDate(match.transaction.issuedAt, "PPP") : "-"}
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-muted-foreground">Amount</span>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(match.transaction.total ?? match.matchedAmount, currency)}
                </p>
              </div>

              {match.transaction.name && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Name</span>
                  <p className="font-medium">{match.transaction.name}</p>
                </div>
              )}

              {match.transaction.description && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Description</span>
                  <p className="text-sm">{match.transaction.description}</p>
                </div>
              )}

              {match.transaction.merchant && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Merchant</span>
                  <p className="text-sm">{match.transaction.merchant}</p>
                </div>
              )}

              {match.transaction.category && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Category</span>
                  <Badge style={{ backgroundColor: match.transaction.category.color }}>
                    {match.transaction.category.name}
                  </Badge>
                </div>
              )}

              {match.transaction.project && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Project</span>
                  <Badge style={{ backgroundColor: match.transaction.project.color }}>
                    {match.transaction.project.name}
                  </Badge>
                </div>
              )}

              {match.transaction.note && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Note</span>
                  <p className="text-sm text-muted-foreground">{match.transaction.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong>What happens when you approve:</strong> The CSV data will be merged with the existing transaction.
            User-entered data (category, project, notes) will be preserved. Missing details from the CSV (like merchant
            or reference) will be added.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
