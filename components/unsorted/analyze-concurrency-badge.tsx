"use client"

import { analyzeLimiter } from "@/lib/analyze-queue"
import { useSyncExternalStore } from "react"

export function AnalyzeConcurrencyBadge() {
  const active = useSyncExternalStore(analyzeLimiter.subscribe, analyzeLimiter.getActiveSnapshot, () => 0)

  if (active === 0) return null

  return (
    <span className="text-xs text-muted-foreground whitespace-nowrap">
      Analyzing {active} doc{active === 1 ? "" : "s"}…
    </span>
  )
}
