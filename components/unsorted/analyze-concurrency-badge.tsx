"use client"

import { analyzeProgress, type AnalyzeCounts } from "@/lib/analyze-queue"
import { useSyncExternalStore } from "react"

const EMPTY: AnalyzeCounts = { analyzing: 0, queued: 0, done: 0, error: 0, total: 0 }

export function AnalyzeConcurrencyBadge() {
  const counts = useSyncExternalStore(analyzeProgress.subscribe, analyzeProgress.getCountsSnapshot, () => EMPTY)

  const parts: string[] = []
  if (counts.analyzing > 0) parts.push(`analyzing ${counts.analyzing}`)
  if (counts.queued > 0) parts.push(`queued ${counts.queued}`)
  if (counts.done > 0) parts.push(`done ${counts.done}`)
  if (counts.error > 0) parts.push(`failed ${counts.error}`)
  if (parts.length === 0) return null

  const text = parts.join(", ")
  const display = text.charAt(0).toUpperCase() + text.slice(1)

  return <span className="text-xs text-muted-foreground whitespace-nowrap">{display}</span>
}
