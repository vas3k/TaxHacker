"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

type MatchDisplayProps = {
  matchNumber: number
  confidence: number
  existingTransaction: {
    id: string
    name: string | null
    merchant: string | null
    total: number | null
    currencyCode: string | null
    issuedAt: Date | null
    categoryCode: string | null
    projectCode: string | null
  }
  extractedData: {
    name?: string
    merchant?: string
    total?: number
    currencyCode?: string
    issuedAt?: string
  }
  onMerge: () => void
  isProcessing: boolean
}

export function MatchDisplay({
  matchNumber,
  confidence,
  existingTransaction,
  extractedData,
  onMerge,
  isProcessing,
}: MatchDisplayProps) {
  // Confidence badge color
  const getBadgeColor = () => {
    if (confidence >= 90) return "bg-green-600"
    if (confidence >= 80) return "bg-yellow-600"
    return "bg-orange-600"
  }

  const getBadgeText = () => {
    if (confidence >= 90) return "High Confidence"
    if (confidence >= 80) return "Good Match"
    return "Possible Match"
  }

  return (
    <Card className="p-4 border-2">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">
            Match #{matchNumber}
          </span>
          <Badge className={getBadgeColor()}>
            {confidence}% {getBadgeText()}
          </Badge>
        </div>
        <Link
          href={`/transactions/${existingTransaction.id}`}
          target="_blank"
          className="text-sm text-blue-600 hover:underline"
        >
          View Transaction →
        </Link>
      </div>

      {/* Comparison Grid */}
      <div className="space-y-2 mb-4 text-sm">
        {/* Name */}
        <div className="grid grid-cols-[120px_1fr_auto_1fr] gap-2 items-center">
          <div className="font-medium">Name:</div>
          <div className="text-muted-foreground truncate">
            {extractedData.name || "-"}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="truncate">{existingTransaction.name || "-"}</div>
        </div>

        {/* Merchant */}
        <div className="grid grid-cols-[120px_1fr_auto_1fr] gap-2 items-center">
          <div className="font-medium">Merchant:</div>
          <div className="text-muted-foreground truncate">
            {extractedData.merchant || "-"}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="truncate">{existingTransaction.merchant || "-"}</div>
        </div>

        {/* Amount */}
        <div className="grid grid-cols-[120px_1fr_auto_1fr] gap-2 items-center">
          <div className="font-medium">Amount:</div>
          <div className="text-muted-foreground">
            {extractedData.total !== undefined
              ? formatCurrency(extractedData.total, extractedData.currencyCode || "USD")
              : "-"}
          </div>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <div>
            {existingTransaction.total !== null
              ? formatCurrency(
                  existingTransaction.total,
                  existingTransaction.currencyCode || "USD"
                )
              : "-"}
          </div>
        </div>

        {/* Date */}
        <div className="grid grid-cols-[120px_1fr_auto_1fr] gap-2 items-center">
          <div className="font-medium">Date:</div>
          <div className="text-muted-foreground">
            {extractedData.issuedAt
              ? format(new Date(extractedData.issuedAt), "MMM d, yyyy")
              : "-"}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div>
            {existingTransaction.issuedAt
              ? format(existingTransaction.issuedAt, "MMM d, yyyy")
              : "-"}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={onMerge}
        disabled={isProcessing}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Merge with This Transaction
      </Button>
    </Card>
  )
}
