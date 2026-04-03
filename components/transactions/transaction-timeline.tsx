"use client"

import { useState, useMemo } from "react"
import { formatDate } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Edit, GitMerge, FileCheck, FileX, Calendar } from "lucide-react"
import Link from "next/link"
import { SourceBadge } from "@/components/import/source-badge"
import { CSVFormat } from "@/lib/csv/format-detector"
import { TransactionAuditLog } from "@/prisma/client"
import { auditLogsToTimelineEvents, groupTimelineEventsByTimestamp, formatFieldName, formatValue } from "@/lib/timeline-utils"
import { TimelineEvent, GroupedTimelineEvents } from "@/types/timeline"

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

type TransactionTimelineProps = {
  matches: TransactionMatch[]
  auditLogs: TransactionAuditLog[]
  transactionCreatedAt: Date
  transactionUpdatedAt: Date
}

export function TransactionTimeline({
  matches,
  auditLogs,
  transactionCreatedAt,
  transactionUpdatedAt
}: TransactionTimelineProps) {
  const [showAllEdits, setShowAllEdits] = useState(false)

  // Convert and group timeline events
  const { timelineEvents, groupedEvents, manualEditGroups, otherGroups, hiddenEditCount } = useMemo(() => {
    const events = auditLogsToTimelineEvents(auditLogs, transactionCreatedAt)
    const grouped = groupTimelineEventsByTimestamp(events)

    // Separate manual edits from other events
    const manualEdits = grouped.filter(group =>
      group.events.some(e => e.type === "manual_edit")
    )
    const other = grouped.filter(group =>
      !group.events.some(e => e.type === "manual_edit")
    )

    // Show first 5 manual edit groups by default
    const visibleEditCount = showAllEdits ? manualEdits.length : Math.min(5, manualEdits.length)
    const hidden = Math.max(0, manualEdits.length - visibleEditCount)

    return {
      timelineEvents: events,
      groupedEvents: grouped,
      manualEditGroups: manualEdits,
      otherGroups: other,
      hiddenEditCount: hidden
    }
  }, [auditLogs, showAllEdits])

  // Get events to display
  const displayEvents = useMemo(() => {
    if (showAllEdits) {
      return groupedEvents
    }

    // Show first 5 manual edit groups + all other groups
    const visibleManualEdits = manualEditGroups.slice(0, 5)
    return [...otherGroups, ...visibleManualEdits].sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    )
  }, [groupedEvents, manualEditGroups, otherGroups, showAllEdits])

  const renderEvent = (event: TimelineEvent, groupTimestamp: Date) => {
    switch (event.type) {
      case "created": {
        const metadata = event.metadata as any
        const source = metadata?.source
        const batchId = metadata?.batchId
        const batchFilename = metadata?.batchFilename
        const format = metadata?.format as CSVFormat | undefined
        const isImported = source === "csv_import" || source === "file_analysis"

        return (
          <Card key={`${groupTimestamp.getTime()}-created`} className="p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Plus className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {isImported ? "Imported from" : "Transaction Created"}
                  </span>
                  <Badge className="bg-green-600">Created</Badge>
                </div>
                {isImported && batchId && batchFilename && (
                  <div className="flex items-center gap-2">
                    {format && <SourceBadge format={format} size="sm" showLabel={false} />}
                    <Link
                      href={`/import/history/${batchId}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {batchFilename}
                    </Link>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  {formatDate(groupTimestamp, "PPpp")}
                </p>
              </div>
            </div>
          </Card>
        )
      }

      case "manual_edit":
        return (
          <Card key={`${groupTimestamp.getTime()}-edit-${event.fieldName}`} className="p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Edit className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Manual Edit</span>
                  <Badge className="bg-blue-600">Edited</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  {formatDate(groupTimestamp, "PPpp")}
                </p>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
                  <div className="font-medium text-muted-foreground">
                    {formatFieldName(event.fieldName)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">From:</span>
                    <span className="ml-2 line-through">{formatValue(event.oldValue)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">To:</span>
                    <span className="ml-2 font-medium">{formatValue(event.newValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )

      case "csv_merge": {
        const match = matches.find(m => m.id === event.matchId)
        const format = (match?.batch.metadata as any)?.format as CSVFormat | undefined

        return (
          <Card key={`${groupTimestamp.getTime()}-merge-${event.fieldName}`} className="p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <GitMerge className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {format && <SourceBadge format={format} size="sm" showLabel={false} />}
                    <Link
                      href={`/import/history/${event.matchId}`}
                      className="font-medium text-sm hover:underline text-blue-600"
                    >
                      {event.batchFilename}
                    </Link>
                  </div>
                  <Badge className="bg-purple-600">CSV Merge</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  {formatDate(groupTimestamp, "PPpp")}
                </p>
                <div className="text-xs">
                  <span className="text-muted-foreground">Field merged:</span>
                  <span className="ml-2 font-medium">{formatFieldName(event.fieldName)}</span>
                </div>
              </div>
            </div>
          </Card>
        )
      }

      case "match_reviewed": {
        const match = matches.find(m => m.id === event.matchId)
        const format = (match?.batch.metadata as any)?.format as CSVFormat | undefined
        const isApproved = event.status === "approved"
        const Icon = isApproved ? FileCheck : FileX
        const color = isApproved ? "text-green-600" : "text-red-600"
        const badgeColor = isApproved ? "bg-green-600" : "bg-red-600"

        return (
          <Card key={`${groupTimestamp.getTime()}-review-${event.matchId}`} className="p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {format && <SourceBadge format={format} size="sm" showLabel={false} />}
                    <Link
                      href={`/import/history/${event.matchId}`}
                      className="font-medium text-sm hover:underline text-blue-600"
                    >
                      {event.batchFilename}
                    </Link>
                  </div>
                  <Badge className={badgeColor}>
                    {isApproved ? "Approved" : "Rejected"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  {formatDate(groupTimestamp, "PPpp")}
                </p>
              </div>
            </div>
          </Card>
        )
      }

      default:
        return null
    }
  }

  // Always show the timeline, even if empty
  return (
    <div className="mt-8">
      <h3 className="text-sm font-medium mb-4">Transaction History</h3>

      <div className="space-y-3">
        {displayEvents.length === 0 ? (
          <Card className="p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              No timeline events recorded yet.
            </p>
          </Card>
        ) : (
          <>
            {displayEvents.map((group) => (
              <div key={group.timestamp.getTime()}>
                {group.events.map((event) => renderEvent(event, group.timestamp))}
              </div>
            ))}

            {hiddenEditCount > 0 && !showAllEdits && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllEdits(true)}
                  className="text-xs"
                >
                  Show {hiddenEditCount} More {hiddenEditCount === 1 ? "Edit" : "Edits"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
