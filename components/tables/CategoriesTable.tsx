"use client"

import { Category } from "@/prisma/client"
import { NamedEntityTable } from "./NamedEntityTable"
import { NamedEntityWithActions } from "./fieldConfigs"
import type { EditableItem } from "@/components/ui/data-table"

type CategoryWithActions = Category & NamedEntityWithActions & EditableItem

interface CategoriesTableProps {
  data: CategoryWithActions[]
  onAdd: (data: Partial<Category>) => Promise<{ success: boolean; error?: string }>
  onEdit: (code: string, data: Partial<Category>) => Promise<{ success: boolean; error?: string }>
  onDelete: (code: string) => Promise<{ success: boolean; error?: string }>
}

export function CategoriesTable({ data, onAdd, onEdit, onDelete }: CategoriesTableProps) {
  return (
    <NamedEntityTable
      data={data}
      entityType="Category"
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}