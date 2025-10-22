"use client"

import { bulkDeleteTransactionsAction, duplicateTransactionAction } from "@/app/(app)/transactions/actions"
import { Button } from "@/components/ui/button"
import { Copy, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface BulkActionsMenuProps {
  selectedIds: string[]
  onActionComplete?: () => void
}

export function BulkActionsMenu({ selectedIds, onActionComplete }: BulkActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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

  const handleDuplicate = async () => {
    try {
      setIsLoading(true)
      const result = await duplicateTransactionAction(selectedIds[0])
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to duplicate transaction")
      }
      router.push(`/transactions/${result.data.id}`)
      onActionComplete?.()
    } catch (error) {
      console.error("Failed to duplicate transaction:", error)
      alert(`Failed to duplicate transaction: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2">
      {selectedIds.length === 1 && (
        <Button variant="outline" className="min-w-48 gap-2" disabled={isLoading} onClick={handleDuplicate}>
          <Copy className="h-4 w-4" />
          Duplicate transaction
        </Button>
      )}
      <Button variant="destructive" className="min-w-48 gap-2" disabled={isLoading} onClick={handleDelete}>
        <Trash2 className="h-4 w-4" />
        Delete {selectedIds.length} transaction{selectedIds.length > 1 ? "s" : ""}
      </Button>
    </div>
  )
}
