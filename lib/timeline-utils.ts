import { TransactionAuditLog } from "@/prisma/client"
import { TimelineEvent, GroupedTimelineEvents } from "@/types/timeline"

/**
 * Convert audit logs to timeline events
 */
export function auditLogsToTimelineEvents(logs: TransactionAuditLog[], transactionCreatedAt?: Date): TimelineEvent[] {
  const events = logs.map((log) => {
    const timestamp = new Date(log.createdAt)

    switch (log.action) {
      case "created": {
        const metadata = log.metadata as Record<string, unknown> | null
        return {
          type: "created" as const,
          timestamp,
          metadata: metadata ? {
            source: (metadata.source as "manual" | "csv_import" | "file_analysis") || "manual",
            batchId: metadata.batchId as string | undefined,
            batchFilename: metadata.batchFilename as string | undefined,
            format: metadata.format as string | undefined,
          } : undefined,
        }
      }

      case "manual_edit":
        return {
          type: "manual_edit" as const,
          timestamp,
          fieldName: log.fieldName || "",
          oldValue: log.oldValue,
          newValue: log.newValue,
        }

      case "csv_merge": {
        const metadata = log.metadata as Record<string, unknown> | null
        return {
          type: "csv_merge" as const,
          timestamp,
          fieldName: log.fieldName || "",
          batchFilename: (metadata?.batchFilename as string) || "",
          matchId: (metadata?.matchId as string) || "",
        }
      }

      case "match_reviewed": {
        const metadata = log.metadata as Record<string, unknown> | null
        return {
          type: "match_reviewed" as const,
          timestamp,
          status: (metadata?.status as string) || "",
          batchFilename: (metadata?.batchFilename as string) || "",
          matchId: (metadata?.matchId as string) || "",
        }
      }

      default:
        return {
          type: "created" as const,
          timestamp,
        }
    }
  })

  // If no created event found and we have a creation date, add it
  const hasCreatedEvent = events.some(e => e.type === "created")
  if (!hasCreatedEvent && transactionCreatedAt) {
    events.push({
      type: "created",
      timestamp: transactionCreatedAt
    })
  }

  return events
}

/**
 * Group timeline events by timestamp
 * Events that happen at the exact same time are grouped together
 */
export function groupTimelineEventsByTimestamp(events: TimelineEvent[]): GroupedTimelineEvents[] {
  const grouped = new Map<number, TimelineEvent[]>()

  for (const event of events) {
    const timestamp = event.timestamp.getTime()
    const existing = grouped.get(timestamp) || []
    existing.push(event)
    grouped.set(timestamp, existing)
  }

  // Convert map to array and sort by timestamp (newest first)
  return Array.from(grouped.entries())
    .map(([timestamp, events]) => ({
      timestamp: new Date(timestamp),
      events,
    }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Format field name for display
 * Converts camelCase/snake_case to Title Case
 */
export function formatFieldName(fieldName: string): string {
  // Handle extra fields like "extra.taxRate"
  if (fieldName.startsWith("extra.")) {
    const field = fieldName.replace("extra.", "")
    return formatFieldName(field)
  }

  // Convert camelCase to spaces
  const withSpaces = fieldName.replace(/([A-Z])/g, " $1").trim()

  // Convert snake_case to spaces
  const normalized = withSpaces.replace(/_/g, " ")

  // Capitalize first letter of each word
  return normalized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

/**
 * Format value for display in timeline
 */
export function formatValue(value: unknown): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return "(empty)"
  }

  // Handle dates
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      }
    } catch {
      // Not a date, continue
    }
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return "(empty)"
    if (value.length === 1) return String(value[0])
    return `[${value.length} items]`
  }

  // Handle objects
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return "(complex object)"
    }
  }

  // Handle booleans
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }

  // Handle numbers (check if it's a currency amount)
  if (typeof value === "number") {
    // If it looks like cents (large integers), format as currency
    if (Number.isInteger(value) && Math.abs(value) > 100) {
      return `$${(value / 100).toFixed(2)}`
    }
    return String(value)
  }

  // Default: convert to string
  return String(value)
}
