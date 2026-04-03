"use client"

import { formatDate } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Clock, FileCheck, FileX, FilePlus, GitMerge, Calendar } from "lucide-react"

type MatchHistoryEntry = {
  id: string
  batchId: string
  confidence: number
  matchedAmount: number
  matchedDate: Date
  status: string
  createdAt: Date
  reviewedAt: Date | null
  reviewedBy: string | null
  batch: {
    filename: string
    createdAt: Date
  }
}

type TransactionHistory = {
  id: string
  name: string | null
  createdAt: Date
  updatedAt: Date
  matches: MatchHistoryEntry[]
}

export function MatchHistory({ transactionId, history }: { transactionId: string; history: TransactionHistory }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'auto_merged':
        return <GitMerge className="h-4 w-4 text-green-600" />
      case 'reviewed_merged':
        return <FileCheck className="h-4 w-4 text-blue-600" />
      case 'reviewed_rejected':
        return <FileX className="h-4 w-4 text-red-600" />
      case 'flagged':
        return <FilePlus className="h-4 w-4 text-yellow-600" />
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

  // Create timeline events from matches and transaction history
  const timelineEvents = [
    {
      type: 'created',
      date: history.createdAt,
      icon: <FilePlus className="h-4 w-4 text-blue-600" />,
      title: 'Transaction Created',
      description: `Created: ${history.name || 'Untitled'}`,
    },
    ...history.matches.map((match) => ({
      type: 'match',
      date: match.createdAt,
      icon: getStatusIcon(match.status),
      title: `Import Match - ${match.batch.filename}`,
      description: `${match.confidence}% confidence`,
      match,
    })),
    ...(history.updatedAt.getTime() !== history.createdAt.getTime()
      ? [{
          type: 'updated',
          date: history.updatedAt,
          icon: <Clock className="h-4 w-4 text-gray-600" />,
          title: 'Transaction Updated',
          description: 'Last modified',
        }]
      : []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-6">
      {/* Transaction Summary */}
      <Card className="p-4">
        <div className="space-y-2">
          <h4 className="font-medium">Transaction Summary</h4>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Name:</dt>
            <dd className="font-medium">{history.name || 'Untitled'}</dd>
            <dt className="text-muted-foreground">Created:</dt>
            <dd>{formatDate(history.createdAt, "PPpp")}</dd>
            <dt className="text-muted-foreground">Last Updated:</dt>
            <dd>{formatDate(history.updatedAt, "PPpp")}</dd>
            <dt className="text-muted-foreground">Total Matches:</dt>
            <dd className="font-medium">{history.matches.length}</dd>
          </dl>
        </div>
      </Card>

      {/* Match History */}
      <div>
        <h4 className="font-medium mb-4">Import Match History</h4>
        {history.matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No import matches found for this transaction.</p>
        ) : (
          <div className="space-y-3">
            {history.matches.map((match) => (
              <Card key={match.id} className="p-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon(match.status)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{match.batch.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(match.createdAt, "PPpp")}
                        </p>
                      </div>
                      {getStatusBadge(match.status)}
                    </div>

                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <dt className="text-muted-foreground">Confidence:</dt>
                      <dd className="font-medium">{match.confidence}%</dd>
                      <dt className="text-muted-foreground">Match Date:</dt>
                      <dd>{formatDate(match.matchedDate, "yyyy-MM-dd")}</dd>
                    </dl>

                    {match.reviewedAt && (
                      <div className="pt-2 border-t text-xs text-muted-foreground">
                        Reviewed on {formatDate(match.reviewedAt, "PPp")}
                        {match.reviewedBy && ` by ${match.reviewedBy}`}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Timeline View */}
      <div>
        <h4 className="font-medium mb-4">Activity Timeline</h4>
        <div className="relative pl-6 space-y-4">
          {/* Timeline line */}
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />

          {timelineEvents.map((event, index) => (
            <div key={index} className="relative">
              {/* Timeline dot */}
              <div className="absolute left-[-1.4rem] top-1 bg-white">
                {event.icon}
              </div>

              <div className="pl-2">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{event.title}</p>
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(event.date, "PPp")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                {event.type === 'match' && 'match' in event && event.match && (
                  <div className="mt-2 text-xs">
                    {getStatusBadge(event.match.status)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
