"use client"

import {
  exportToPaperlessAction,
  fetchPaperlessMetadataAction,
} from "@/app/(app)/export/paperless/actions"
import { FormError } from "@/components/forms/error"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PaperlessCorrespondent, PaperlessTag } from "@/lib/paperless/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CircleCheckBig, Loader2, Upload } from "lucide-react"
import { startTransition, useActionState, useEffect, useState } from "react"

export function PaperlessExportDialog({
  selectedTransactionIds,
  children,
}: {
  selectedTransactionIds: string[]
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [metadataState, fetchMetadata] = useActionState(fetchPaperlessMetadataAction, null)
  const [exportState, exportAction, isExporting] = useActionState(exportToPaperlessAction, null)

  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set())
  const [correspondentId, setCorrespondentId] = useState<string>("")

  const tags = metadataState?.data?.tags || []
  const correspondents = metadataState?.data?.correspondents || []

  useEffect(() => {
    if (open && !metadataState) {
      startTransition(() => fetchMetadata(new FormData()))
    }
  }, [open])

  function toggleTag(tagId: number) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) next.delete(tagId)
      else next.add(tagId)
      return next
    })
  }

  function handleExport() {
    const formData = new FormData()
    formData.set("transactionIds", JSON.stringify(selectedTransactionIds))
    formData.set("tagIds", JSON.stringify(Array.from(selectedTagIds)))
    if (correspondentId && correspondentId !== "-") {
      formData.set("correspondentId", correspondentId)
    }
    startTransition(() => exportAction(formData))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export to Paperless-ngx</DialogTitle>
          <DialogDescription>
            Upload files from {selectedTransactionIds.length} transaction
            {selectedTransactionIds.length !== 1 ? "s" : ""} to Paperless-ngx.
          </DialogDescription>
        </DialogHeader>

        {metadataState?.error && <FormError>{metadataState.error}</FormError>}

        {!metadataState?.data && !metadataState?.error && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {metadataState?.data && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Correspondent</label>
              <Select value={correspondentId} onValueChange={setCorrespondentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select correspondent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-">None</SelectItem>
                  {correspondents.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tags found in Paperless-ngx</p>
                )}
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-1.5 text-sm cursor-pointer hover:bg-muted rounded px-1.5 py-0.5"
                  >
                    <Checkbox
                      checked={selectedTagIds.has(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {exportState?.success && exportState.data && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700 flex items-center gap-2">
            <CircleCheckBig className="h-4 w-4" />
            Uploaded {exportState.data.uploaded} file{exportState.data.uploaded !== 1 ? "s" : ""}.
            {exportState.data.skipped > 0 && ` Skipped ${exportState.data.skipped}.`}
            {exportState.data.failed > 0 && ` Failed: ${exportState.data.failed}.`}
          </div>
        )}

        {exportState?.error && <FormError>{exportState.error}</FormError>}

        <DialogFooter>
          <Button
            onClick={handleExport}
            disabled={isExporting || !metadataState?.data}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Export to Paperless-ngx
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
