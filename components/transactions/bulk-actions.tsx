"use client"

import { bulkDeleteTransactionsAction } from "@/app/(app)/transactions/actions"
import { DeleteModal } from "@/components/transactions/delete-file-modal"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useState } from "react"

interface BulkActionsMenuProps {
  selectedIds: string[]
  onActionComplete?: () => void
}

export function BulkActionsMenu({ selectedIds, onActionComplete }: BulkActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const handleDelete = async () => {
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
      setDeleteModalOpen(false)
    }
  }

  const openDeleteModal = () => {
    setDeleteModalOpen(true)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button variant="destructive" className="min-w-48 gap-2" disabled={isLoading} onClick={openDeleteModal}>
        <Trash2 className="h-4 w-4" />
        Delete {selectedIds.length} transactions
      </Button>

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Transactions"
        description={`Are you sure you want to delete ${selectedIds.length} transaction${selectedIds.length > 1 ? 's' : ''} and all their files? This action cannot be undone.`}
      />
    </div>
  )
}
