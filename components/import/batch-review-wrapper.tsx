"use client"

import { useState, useTransition } from "react"
import { BatchReviewTable } from "./batch-review-table"
import { MatchHistory } from "./match-history"
import { approveMatchAction, rejectMatchAction, getTransactionMatchHistory } from "@/app/(app)/import/history/[batchId]/actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CSVFormat } from "@/lib/csv/format-detector"

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

export function BatchReviewWrapper({
  autoMergedMatches,
  flaggedMatches,
  reviewedMergedMatches,
  reviewedRejectedMatches,
  batchFormat,
}: {
  autoMergedMatches: TransactionMatch[]
  flaggedMatches: TransactionMatch[]
  reviewedMergedMatches: TransactionMatch[]
  reviewedRejectedMatches: TransactionMatch[]
  batchFormat?: CSVFormat
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleApprove = async (matchId: string) => {
    startTransition(async () => {
      const result = await approveMatchAction(matchId)
      if (result?.success) {
        toast.success("Match approved and merged")
        router.refresh()
      } else {
        toast.error(result?.error || "Failed to approve match")
      }
    })
  }

  const handleReject = async (matchId: string) => {
    startTransition(async () => {
      const result = await rejectMatchAction(matchId)
      if (result?.success) {
        toast.success("Match rejected")
        router.refresh()
      } else {
        toast.error(result?.error || "Failed to reject match")
      }
    })
  }

  return (
    <>
      <BatchReviewTable
        matches={autoMergedMatches}
        title="Auto-Merged Transactions"
        description="High confidence matches that were automatically merged"
        variant="auto-merged"
        batchFormat={batchFormat}
      />

      <BatchReviewTable
        matches={flaggedMatches}
        title="Flagged for Review"
        description="Lower confidence matches that need manual review"
        variant="flagged"
        onApprove={handleApprove}
        onReject={handleReject}
        batchFormat={batchFormat}
      />

      <BatchReviewTable
        matches={reviewedMergedMatches}
        title="Reviewed & Merged"
        description="Matches that were manually reviewed and approved"
        variant="reviewed-merged"
        batchFormat={batchFormat}
      />

      <BatchReviewTable
        matches={reviewedRejectedMatches}
        title="Reviewed & Rejected"
        description="Matches that were manually reviewed and rejected"
        variant="reviewed-rejected"
        batchFormat={batchFormat}
      />
    </>
  )
}
