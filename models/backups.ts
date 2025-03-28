import { prisma } from "@/lib/db"

type ModelEntry = {
  filename: string
  model: any
  idField: string
}

// Ordering is important here
export const MODEL_BACKUP: ModelEntry[] = [
  {
    filename: "settings.json",
    model: prisma.setting,
    idField: "code",
  },
  {
    filename: "currencies.json",
    model: prisma.currency,
    idField: "code",
  },
  {
    filename: "categories.json",
    model: prisma.category,
    idField: "code",
  },
  {
    filename: "projects.json",
    model: prisma.project,
    idField: "code",
  },
  {
    filename: "fields.json",
    model: prisma.field,
    idField: "code",
  },
  {
    filename: "files.json",
    model: prisma.file,
    idField: "id",
  },
  {
    filename: "transactions.json",
    model: prisma.transaction,
    idField: "id",
  },
]
