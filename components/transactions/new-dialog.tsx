"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Category, Currency, Project } from "@/prisma/client"
import TransactionCreateForm from "./create"

export function NewTransactionDialogClient({
  children,
  categories,
  currencies,
  settings,
  projects,
}: {
  children: React.ReactNode
  categories: Category[]
  currencies: Currency[]
  settings: Record<string, string>
  projects: Project[]
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{children}</Button>
      </DialogTrigger>
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
