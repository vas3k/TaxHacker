import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { getImportBatches } from "@/models/import-batches"
import { CheckCircle2, FileSpreadsheet, Flag, PlusCircle } from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"
import { ImportHistoryTable } from "@/components/import/import-history-table"

export const metadata: Metadata = {
  title: "Import History",
  description: "View your CSV import history and matching results",
}

export default async function ImportHistoryPage() {
  const user = await getCurrentUser()
  const batches = await getImportBatches(user.id, 50)

  const totalImports = batches.length
  const totalMatched = batches.reduce((sum, batch) => sum + batch.matchedCount, 0)
  const totalCreated = batches.reduce((sum, batch) => sum + batch.createdCount, 0)
  const totalFlagged = batches.reduce((sum, batch) => sum + batch.skippedCount, 0)

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="flex flex-row gap-3 md:gap-5">
          <span className="text-3xl font-bold tracking-tight">Import History</span>
          <span className="text-3xl tracking-tight opacity-20">{totalImports}</span>
        </h2>
        <div className="flex gap-2">
          <Link href="/import/csv">
            <Button>
              <FileSpreadsheet />
              <span className="hidden md:block">Import CSV</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/40 border-green-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Merged</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalMatched}</div>
            <p className="text-xs text-muted-foreground">High confidence matches</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 border-blue-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created New</CardTitle>
            <PlusCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalCreated}</div>
            <p className="text-xs text-muted-foreground">New transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-yellow-50/30 to-amber-50/40 border-yellow-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <Flag className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalFlagged}</div>
            <p className="text-xs text-muted-foreground">Needs review</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-gray-50/30 to-slate-50/40 border-gray-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Imports</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImports}</div>
            <p className="text-xs text-muted-foreground">CSV files processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Import Batches Table */}
      <main>
        {batches.length > 0 ? (
          <ImportHistoryTable batches={batches} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 h-full min-h-[400px]">
            <p className="text-muted-foreground">No import history yet. Start by importing your first CSV file!</p>
            <Link href="/import/csv" className="mt-8">
              <Button>
                <FileSpreadsheet /> Import CSV
              </Button>
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
