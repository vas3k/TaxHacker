"use client"

import { Project } from "@/prisma/client"
import { NamedEntityTable } from "./NamedEntityTable"
import { NamedEntityWithActions } from "./fieldConfigs"

type ProjectWithActions = Project & {
  isEditable: boolean
  isDeletable: boolean
} & NamedEntityWithActions

interface ProjectsTableProps {
  data: ProjectWithActions[]
  onAdd: (data: Partial<Project>) => Promise<{ success: boolean; error?: string }>
  onEdit: (code: string, data: Partial<Project>) => Promise<{ success: boolean; error?: string }>
  onDelete: (code: string) => Promise<{ success: boolean; error?: string }>
}

export function ProjectsTable({ data, onAdd, onEdit, onDelete }: ProjectsTableProps) {
  return (
    <NamedEntityTable
      data={data}
      entityType="Project"
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}