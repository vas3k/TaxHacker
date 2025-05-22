"use client"

import { Button } from "@/components/ui/button"
import { Swords } from "lucide-react"

export function AnalyzeAllButton() {
  const handleAnalyzeAll = () => {
    document.querySelectorAll("button[data-analyze-button]").forEach((button) => {
      ;(button as HTMLButtonElement).click()
    })
  }

  return (
    <Button variant="outline" className="flex items-center gap-2" onClick={handleAnalyzeAll}>
      <Swords className="h-4 w-4" />
      Analyze all
    </Button>
  )
}
