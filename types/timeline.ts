export type TimelineEventType = "created" | "manual_edit" | "csv_merge" | "match_reviewed"

export type TimelineEvent =
  | {
      type: "created"
      timestamp: Date
      metadata?: {
        source?: "manual" | "csv_import" | "file_analysis"
        batchId?: string
        batchFilename?: string
        format?: string
      }
    }
  | {
      type: "manual_edit"
      timestamp: Date
      fieldName: string
      oldValue: any
      newValue: any
    }
  | {
      type: "csv_merge"
      timestamp: Date
      fieldName: string
      batchFilename: string
      matchId: string
    }
  | {
      type: "match_reviewed"
      timestamp: Date
      status: string
      batchFilename: string
      matchId: string
    }

export type GroupedTimelineEvents = {
  timestamp: Date
  events: TimelineEvent[]
}
