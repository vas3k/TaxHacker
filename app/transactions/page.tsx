import { ExportTransactionsDialog } from "@/components/export/transactions"
import { UploadButton } from "@/components/files/upload-button"
import { TransactionSearchAndFilters } from "@/components/transactions/filters"
import { TransactionList } from "@/components/transactions/list"
import { NewTransactionDialog } from "@/components/transactions/new"
import { Button } from "@/components/ui/button"
import { getCategories } from "@/data/categories"
import { getFields } from "@/data/fields"
import { getProjects } from "@/data/projects"
import { getTransactions, TransactionFilters } from "@/data/transactions"
import { Download, Plus, Upload } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Transactions",
  description: "Manage your transactions",
}

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<TransactionFilters> }) {
  const filters = await searchParams
  const transactions = await getTransactions(filters)
  const categories = await getCategories()
  const projects = await getProjects()
  const fields = await getFields()

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="flex flex-row gap-3 md:gap-5">
          <span className="text-3xl font-bold tracking-tight">Transactions</span>
          <span className="text-3xl tracking-tight opacity-20">{transactions.length}</span>
        </h2>
        <div className="flex gap-2">
          <ExportTransactionsDialog fields={fields} categories={categories} projects={projects}>
            <Button variant="outline">
              <Download />
              <span className="hidden md:block">Export</span>
            </Button>
          </ExportTransactionsDialog>
          <NewTransactionDialog>
            <Button>
              <Plus /> <span className="hidden md:block">Add Transaction</span>
            </Button>
          </NewTransactionDialog>
        </div>
      </header>

      <TransactionSearchAndFilters categories={categories} projects={projects} />

      <main>
        <TransactionList transactions={transactions} />

        {transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 h-full min-h-[400px]">
            <p className="text-muted-foreground">
              You don't seem to have any transactions yet. Let's start and create the first one!
            </p>
            <div className="flex flex-row gap-5 mt-8">
              <UploadButton>
                <Upload /> Analyze New Invoice
              </UploadButton>
              <NewTransactionDialog>
                <Button variant="outline">
                  <Plus />
                  Add Manually
                </Button>
              </NewTransactionDialog>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
