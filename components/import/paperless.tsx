"use client"

import {
  fetchPaperlessDocumentsAction,
  importPaperlessDocumentsAction,
} from "@/app/(app)/import/paperless/actions"
import { FormError } from "@/components/forms/error"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PaperlessCorrespondent, PaperlessDocument, PaperlessTag } from "@/lib/paperless/types"
import { ChevronLeft, ChevronRight, Download, Loader2, Search, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { startTransition, useActionState, useEffect, useState } from "react"

export function PaperlessImport({ isPaperlessConfigured }: { isPaperlessConfigured: boolean }) {
  const router = useRouter()
  const [fetchState, fetchAction, isFetching] = useActionState(fetchPaperlessDocumentsAction, null)
  const [importState, importAction, isImporting] = useActionState(importPaperlessDocumentsAction, null)

  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const documents = fetchState?.data?.documents
  const tags = fetchState?.data?.tags || []
  const correspondents = fetchState?.data?.correspondents || []

  const tagMap = new Map(tags.map((t) => [t.id, t]))
  const correspondentMap = new Map(correspondents.map((c) => [c.id, c]))

  useEffect(() => {
    if (isPaperlessConfigured) {
      fetchDocuments(1)
    }
  }, [isPaperlessConfigured])

  useEffect(() => {
    if (importState?.success) {
      router.push("/unsorted")
    }
  }, [importState, router])

  function fetchDocuments(pageNum: number, searchQuery?: string) {
    const formData = new FormData()
    formData.set("page", String(pageNum))
    if (searchQuery || query) formData.set("query", searchQuery ?? query)
    startTransition(() => fetchAction(formData))
    setPage(pageNum)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSelectedIds(new Set())
    fetchDocuments(1, query)
  }

  function toggleSelection(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (!documents?.results) return
    const allIds = documents.results.map((d) => d.id)
    const allSelected = allIds.every((id) => selectedIds.has(id))
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        allIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        allIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  function handleImport() {
    if (selectedIds.size === 0) return
    const formData = new FormData()
    formData.set("documentIds", JSON.stringify(Array.from(selectedIds)))
    startTransition(() => importAction(formData))
  }

  if (!isPaperlessConfigured) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Settings className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Paperless-ngx Not Configured</h2>
        <p className="text-muted-foreground text-center max-w-md">
          To import documents from Paperless-ngx, configure your connection settings first.
        </p>
        <Link href="/settings/paperless">
          <Button>Configure Paperless-ngx</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold">Import from Paperless-ngx</h2>
        {selectedIds.size > 0 && (
          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Import {selectedIds.size} document{selectedIds.size !== 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {importState?.success && importState.data && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700">
          Imported {importState.data.imported} document{importState.data.imported !== 1 ? "s" : ""}.
          {importState.data.skipped > 0 && ` Skipped ${importState.data.skipped} (already imported).`}
          {importState.data.failed > 0 && ` Failed: ${importState.data.failed}.`}
        </div>
      )}

      {importState?.error && <FormError>{importState.error}</FormError>}

      <form onSubmit={handleSearch} className="flex flex-row gap-2">
        <Input
          type="text"
          placeholder="Search documents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline" disabled={isFetching}>
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {fetchState?.error && <FormError>{fetchState.error}</FormError>}

      {isFetching && !documents && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {documents && (
        <>
          <div className="text-sm text-muted-foreground">
            {documents.count} document{documents.count !== 1 ? "s" : ""} found
          </div>

          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 w-10">
                    <Checkbox
                      checked={
                        documents.results.length > 0 && documents.results.every((d) => selectedIds.has(d.id))
                      }
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="p-2 text-left font-medium">Title</th>
                  <th className="p-2 text-left font-medium hidden md:table-cell">Correspondent</th>
                  <th className="p-2 text-left font-medium hidden lg:table-cell">Tags</th>
                  <th className="p-2 text-left font-medium hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {documents.results.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    selected={selectedIds.has(doc.id)}
                    onToggle={() => toggleSelection(doc.id)}
                    correspondentMap={correspondentMap}
                    tagMap={tagMap}
                  />
                ))}
                {documents.results.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No documents found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-row items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={!documents.previous || isFetching}
              onClick={() => fetchDocuments(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!documents.next || isFetching}
              onClick={() => fetchDocuments(page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function DocumentRow({
  doc,
  selected,
  onToggle,
  correspondentMap,
  tagMap,
}: {
  doc: PaperlessDocument
  selected: boolean
  onToggle: () => void
  correspondentMap: Map<number, PaperlessCorrespondent>
  tagMap: Map<number, PaperlessTag>
}) {
  const correspondent = doc.correspondent ? correspondentMap.get(doc.correspondent) : null

  return (
    <tr className="border-t hover:bg-muted/30 cursor-pointer" onClick={onToggle}>
      <td className="p-2" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={onToggle} />
      </td>
      <td className="p-2">
        <div className="font-medium">{doc.title}</div>
        <div className="text-xs text-muted-foreground">{doc.original_file_name}</div>
      </td>
      <td className="p-2 hidden md:table-cell text-muted-foreground">
        {correspondent?.name || "—"}
      </td>
      <td className="p-2 hidden lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {doc.tags.slice(0, 3).map((tagId) => {
            const tag = tagMap.get(tagId)
            return tag ? (
              <Badge key={tagId} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ) : null
          })}
          {doc.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{doc.tags.length - 3}
            </Badge>
          )}
        </div>
      </td>
      <td className="p-2 hidden md:table-cell text-muted-foreground">{doc.created_date}</td>
    </tr>
  )
}
