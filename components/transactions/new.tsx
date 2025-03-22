import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getCategories } from "@/models/categories"
import { getCurrencies } from "@/models/currencies"
import { getProjects } from "@/models/projects"
import { getSettings } from "@/models/settings"
import TransactionCreateForm from "./create"

export async function NewTransactionDialog({ children }: { children: React.ReactNode }) {
  const categories = await getCategories()
  const currencies = await getCurrencies()
  const settings = await getSettings()
  const projects = await getProjects()

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">New Transaction</DialogTitle>
          <DialogDescription>Create a new transaction</DialogDescription>
        </DialogHeader>

        <TransactionCreateForm
          categories={categories}
          currencies={currencies}
          settings={settings}
          projects={projects}
        />
      </DialogContent>
    </Dialog>
  )
}
