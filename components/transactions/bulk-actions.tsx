"use client"

import { bulkDeleteTransactionsAction } from "@/app/(app)/transactions/actions"
import { PaperlessExportDialog } from "@/components/export/paperless-export-dialog"
import { Button } from "@/components/ui/button"
import { FileUp, Trash2 } from "lucide-react"
import { useState } from "react"

interface BulkActionsMenuProps {
  selectedIds: string[]
  onActionComplete?: () => void
  isPaperlessEnabled?: boolean
}

export function BulkActionsMenu({ selectedIds, onActionComplete, isPaperlessEnabled }: BulkActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    const confirmMessage =
      "Are you sure you want to delete these transactions and all their files? This action cannot be undone."
    if (!confirm(confirmMessage)) return

    try {
      setIsLoading(true)
      const result = await bulkDeleteTransactionsAction(selectedIds)
      if (!result.success) {
        throw new Error(result.error)
      }
      onActionComplete?.()
    } catch (error) {
      console.error("Failed to delete transactions:", error)
      alert(`Failed to delete transactions: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2">
      {isPaperlessEnabled && (
        <PaperlessExportDialog selectedTransactionIds={selectedIds}>
          <Button variant="outline" className="min-w-48 gap-2">
            <FileUp className="h-4 w-4" />
            Export to Paperless
          </Button>
        </PaperlessExportDialog>
      )}
      <Button variant="destructive" className="min-w-48 gap-2" disabled={isLoading} onClick={handleDelete}>
        <Trash2 className="h-4 w-4" />
        Delete {selectedIds.length} transactions
      </Button>
    </div>
  )
}
