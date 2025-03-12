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
    <>
      <Card className="flex flex-col md:flex-row flex-wrap justify-center items-start gap-10 p-5 bg-accent max-w-6xl">
        <div className="flex-1">
          <TransactionEditForm
            transaction={transaction}
            categories={categories}
            currencies={currencies}
            settings={settings}
            fields={fields}
            projects={projects}
          />
        </div>

        <div className="max-w-[320px] space-y-4">
          <TransactionFiles transaction={transaction} files={files} />
        </div>
      </Card>

      {transaction.text && (
        <Card className="flex items-stretch p-5 mt-10 max-w-6xl">
          <div className="flex-1">
            <FormTextarea
              title="Recognized Text"
              name="text"
              defaultValue={transaction.text || ""}
              hideIfEmpty={true}
              className="w-full h-[400px]"
            />
          </div>
        </Card>
      )}
    </>
  )
}
