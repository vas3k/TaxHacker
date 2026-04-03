import { MatchReviewList } from "@/components/import/match-review-list"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { getImportBatchById } from "@/models/import-batches"
import { getFlaggedMatches } from "@/models/transaction-matches"
import { ArrowLeft } from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SourceBadge } from "@/components/import/source-badge"
import { CSVFormat } from "@/lib/csv/format-detector"

export const metadata: Metadata = {
  title: "Review Flagged Matches",
  description: "Review and approve or reject flagged transaction matches",
}

export default async function ReviewMatchesPage({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const { batchId } = await params
  const user = await getCurrentUser()

  const batch = await getImportBatchById(batchId, user.id)
  if (!batch) {
    notFound()
  }

  const flaggedMatches = await getFlaggedMatches(batchId)
  const format = (batch.metadata as any)?.format as CSVFormat | undefined

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <div className="flex flex-col gap-2">
          <Link href={`/import/history/${batchId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Batch Details
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {format && <SourceBadge format={format} size="lg" showLabel={true} />}
            <h2 className="text-3xl font-bold tracking-tight">Review Flagged Matches</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {flaggedMatches.length} match{flaggedMatches.length !== 1 ? "es" : ""} need{flaggedMatches.length === 1 ? "s" : ""} your review
          </p>
        </div>
      </header>

      <main>
        {flaggedMatches.length > 0 ? (
          <MatchReviewList matches={flaggedMatches} batchId={batchId} format={format} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 h-full min-h-[400px]">
            <p className="text-muted-foreground">No flagged matches to review. All matches have been processed!</p>
            <Link href={`/import/history/${batchId}`} className="mt-8">
              <Button>
                <ArrowLeft className="h-4 w-4" />
                Back to Batch Details
              </Button>
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
