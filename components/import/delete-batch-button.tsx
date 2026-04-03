"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { deleteImportBatchAction } from "@/app/(app)/import/history/[batchId]/actions"
import { toast } from "sonner"
import { Trash } from "lucide-react"

export function DeleteImportBatchButton({ batchId, filename }: { batchId: string; filename: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete import "${filename}"? This removes all transactions created by this batch.`
    )
    if (!confirmed) return

    startTransition(async () => {
      const result = await deleteImportBatchAction(batchId)
      if (result?.success) {
        toast.success("Import batch deleted")
        router.push("/import/history")
        router.refresh()
      } else {
        toast.error(result?.error || "Failed to delete import batch")
      }
    })
  }

  return (
    <Button variant="destructive" onClick={handleDelete} disabled={isPending} size="sm">
      <Trash className="h-4 w-4" />
      {isPending ? "Deleting..." : "Delete Batch"}
    </Button>
  )
}
