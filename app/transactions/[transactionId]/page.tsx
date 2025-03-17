import { FormTextarea } from "@/components/forms/simple"
import TransactionEditForm from "@/components/transactions/edit"
import TransactionFiles from "@/components/transactions/transaction-files"
import { Card } from "@/components/ui/card"
import { getCategories } from "@/data/categories"
import { getCurrencies } from "@/data/currencies"
import { getFields } from "@/data/fields"
import { getFilesByTransactionId } from "@/data/files"
import { getProjects } from "@/data/projects"
import { getSettings } from "@/data/settings"
import { getTransactionById } from "@/data/transactions"
import { notFound } from "next/navigation"

export default async function TransactionPage({ params }: { params: Promise<{ transactionId: string }> }) {
  const { transactionId } = await params
  const transaction = await getTransactionById(transactionId)
  if (!transaction) {
    notFound()
  }

  const files = await getFilesByTransactionId(transactionId)
  const categories = await getCategories()
  const currencies = await getCurrencies()
  const settings = await getSettings()
  const fields = await getFields()
  const projects = await getProjects()

  return (
    <div className="flex flex-wrap flex-row items-start justify-center gap-4 max-w-6xl">
      <Card className="w-full flex-1 flex flex-col flex-wrap justify-center items-start gap-10 p-5 bg-accent">
        <div className="w-full">
          <TransactionEditForm
            transaction={transaction}
            categories={categories}
            currencies={currencies}
            settings={settings}
            fields={fields}
            projects={projects}
          />

          {transaction.text && (
            <details className="mt-10">
              <summary className="cursor-pointer text-sm font-medium">Recognized Text</summary>
              <Card className="flex items-stretch p-2 max-w-6xl">
                <div className="flex-1">
                  <FormTextarea
                    title=""
                    name="text"
                    defaultValue={transaction.text || ""}
                    hideIfEmpty={true}
                    className="w-full h-[400px]"
                  />
                </div>
              </Card>
            </details>
          )}
        </div>
      </Card>

      <div className="w-1/3 max-w-[380px] space-y-4">
        <TransactionFiles transaction={transaction} files={files} />
      </div>
    </div>
  )
}
