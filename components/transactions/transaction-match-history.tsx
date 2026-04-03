"use client"

import { formatDate } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { GitMerge, FileCheck, FileX, Clock, Calendar } from "lucide-react"
import Link from "next/link"
import { SourceBadge } from "@/components/import/source-badge"
import { CSVFormat } from "@/lib/csv/format-detector"

type TransactionMatch = {
  id: string
  status: string
  confidence: number
  matchedAmount: number
  matchedDate: Date
  createdAt: Date
  reviewedAt: Date | null
  reviewedBy: string | null
  batchId: string
  batch: {
    filename: string
    createdAt: Date
    metadata?: {
      format?: CSVFormat
      [key: string]: any
    } | null
  }
}

type TransactionMatchHistoryProps = {
  matches: TransactionMatch[]
  transactionCreatedAt: Date
  transactionUpdatedAt: Date
}

export function TransactionMatchHistory({
  matches,
  transactionCreatedAt,
  transactionUpdatedAt
}: TransactionMatchHistoryProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'auto_merged':
        return <GitMerge className="h-4 w-4 text-green-600" />
      case 'reviewed_merged':
        return <FileCheck className="h-4 w-4 text-blue-600" />
      case 'reviewed_rejected':
        return <FileX className="h-4 w-4 text-red-600" />
      case 'flagged':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'auto_merged':
        return <Badge className="bg-green-600">Auto-Merged</Badge>
      case 'reviewed_merged':
        return <Badge className="bg-blue-600">Reviewed & Merged</Badge>
      case 'reviewed_rejected':
        return <Badge className="bg-red-600">Rejected</Badge>
      case 'flagged':
        return <Badge className="bg-yellow-600">Flagged</Badge>
      default:
        return <Badge className="bg-gray-600">{status}</Badge>
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'auto_merged':
        return 'Auto-Merged'
      case 'reviewed_merged':
        return 'Reviewed & Merged'
      case 'reviewed_rejected':
        return 'Rejected'
      case 'flagged':
        return 'Flagged for Review'
      default:
        return status
    }
  }

  if (matches.length === 0) {
    return null
  }

  return (
    <details className="mt-8">
      <summary className="cursor-pointer text-sm font-medium mb-4">
        Import Match History ({matches.length})
      </summary>

      <div className="space-y-3 mt-4">
        {matches.map((match) => {
          const format = (match.batch.metadata as any)?.format as CSVFormat | undefined

          return (
            <Card key={match.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getStatusIcon(match.status)}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {format && <SourceBadge format={format} size="sm" showLabel={false} />}
                        <Link
                          href={`/import/history/${match.batchId}`}
                          className="font-medium text-sm hover:underline text-blue-600"
                        >
                          {match.batch.filename}
                        </Link>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {formatDate(match.createdAt, "PPpp")}
                      </p>
                    </div>
                    {getStatusBadge(match.status)}
                  </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-2 font-medium">{getStatusLabel(match.status)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className="ml-2 font-medium">{match.confidence}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Match Date:</span>
                    <span className="ml-2">{formatDate(match.matchedDate, "yyyy-MM-dd")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Imported:</span>
                    <span className="ml-2">{formatDate(match.batch.createdAt, "yyyy-MM-dd")}</span>
                  </div>
                </div>

                {match.reviewedAt && (
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    <Clock className="inline h-3 w-3 mr-1" />
                    Reviewed on {formatDate(match.reviewedAt, "PPp")}
                    {match.reviewedBy && ` by ${match.reviewedBy}`}
                  </div>
                )}
              </div>
            </div>
          </Card>
          )
        })}

        {/* Transaction Timeline */}
        <Card className="p-4 bg-muted/30">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction Created:</span>
              <span className="font-medium">{formatDate(transactionCreatedAt, "PPp")}</span>
            </div>
            {transactionCreatedAt.getTime() !== transactionUpdatedAt.getTime() && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">{formatDate(transactionUpdatedAt, "PPp")}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </details>
  )
}
