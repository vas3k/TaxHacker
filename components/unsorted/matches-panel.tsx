"use client"

import { MatchDisplay } from "@/components/unsorted/match-display"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"

type MatchesPanelProps = {
  matchData: {
    batchId: string
    matches: Array<{
      transactionId: string
      confidence: number
      transaction: any
    }>
  } | null
  formData: {
    name?: string
    merchant?: string
    total?: number
    currencyCode?: string
    issuedAt?: string
  }
  onMerge: (transactionId: string, confidence: number) => void
  isProcessing: boolean
}

export function MatchesPanel({
  matchData,
  formData,
  onMerge,
  isProcessing,
}: MatchesPanelProps) {
  if (!matchData || matchData.matches.length === 0) {
    return null
  }

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">
            Potential Matches Found
          </h3>
        </div>

        <p className="text-sm text-blue-700 mb-4">
          We found {matchData.matches.length} existing transaction{matchData.matches.length > 1 ? 's' : ''}
          {' '}that might match this receipt.
        </p>

        <div className="space-y-3 mb-4">
          {matchData.matches.map((match, index) => (
            <MatchDisplay
              key={match.transactionId}
              matchNumber={index + 1}
              confidence={match.confidence}
              existingTransaction={match.transaction}
              extractedData={formData}
              onMerge={() => onMerge(match.transactionId, match.confidence)}
              isProcessing={isProcessing}
            />
          ))}
        </div>

        <div className="pt-4 border-t border-blue-200">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Or ignore these matches and create a new transaction using the form.
            </p>
          </div>
        </div>
      </Card>
  )
}
