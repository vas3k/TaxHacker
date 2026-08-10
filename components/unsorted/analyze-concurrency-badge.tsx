"use client"

import { analyzeProgress, type AnalyzeCounts } from "@/lib/analyze-queue"
import { useSyncExternalStore } from "react"

const EMPTY: AnalyzeCounts = { analyzing: 0, queued: 0, done: 0, error: 0, total: 0 }

export function AnalyzeConcurrencyBadge() {
  const counts = useSyncExternalStore(analyzeProgress.subscribe, analyzeProgress.getCountsSnapshot, () => EMPTY)

  if (counts.total === 0 || (counts.analyzing === 0 && counts.queued === 0)) return null

  return (
    <span className="text-xs text-muted-foreground whitespace-nowrap">
      Analyzing {counts.analyzing}, queued {counts.queued}
      {counts.done > 0 ? `, done ${counts.done}` : ""}
      {counts.error > 0 ? `, failed ${counts.error}` : ""}
    </span>
  )
}
