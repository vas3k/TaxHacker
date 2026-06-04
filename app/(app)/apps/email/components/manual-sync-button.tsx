"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type ManualSyncButtonProps = {
  isPending: boolean
}

export function ManualSyncButton({ isPending }: ManualSyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleManualSync = async () => {
    setIsSyncing(true)

    try {
      const response = await fetch("/api/email/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || "Email sync completed successfully")
      } else {
        toast.error(data.error || "Failed to sync emails")
      }
    } catch (error) {
      console.error("Error during manual sync:", error)
      toast.error("Failed to sync emails")
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleManualSync} disabled={isPending || isSyncing}>
      <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : "Sync Now"}
    </Button>
  )
}
