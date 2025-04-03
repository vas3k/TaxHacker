"use client"

import { bulkDeleteTransactionsAction } from "@/app/(app)/transactions/actions"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronUp, Trash2 } from "lucide-react"
import { useState } from "react"

const bulkActions = [
  {
    id: "delete",
    label: "Bulk Delete",
    icon: Trash2,
    variant: "destructive" as const,
    action: bulkDeleteTransactionsAction,
    confirmMessage:
      "Are you sure you want to delete these transactions and all their files? This action cannot be undone.",
  },
]

interface BulkActionsMenuProps {
  selectedIds: string[]
  onActionComplete?: () => void
}

export function BulkActionsMenu({ selectedIds, onActionComplete }: BulkActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (actionId: string) => {
    const action = bulkActions.find((a) => a.id === actionId)
    if (!action) return

    if (action.confirmMessage) {
      if (!confirm(action.confirmMessage)) return
    }

    try {
      setIsLoading(true)
      const result = await action.action(selectedIds)
      if (!result.success) {
        throw new Error(result.error)
      }
      onActionComplete?.()
    } catch (error) {
      console.error(`Failed to execute bulk action ${actionId}:`, error)
      alert(`Failed to execute action: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="min-w-48" disabled={isLoading}>
            {selectedIds.length} transactions
            <ChevronUp className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {bulkActions.map((action) => (
            <DropdownMenuItem
              key={action.id}
              onClick={() => handleAction(action.id)}
              className="gap-2"
              disabled={isLoading}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
