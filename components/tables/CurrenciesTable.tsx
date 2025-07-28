"use client"

import { Badge } from "@/components/ui/badge"
import { Currency } from "@/prisma/client"
import { CrudTable, FormDialog, FormField, useCrudForm, type TableColumn, type EditableItem } from "@/components/ui/data-table"
import { toast } from "sonner"

type CurrencyWithActions = Currency & EditableItem

interface CurrenciesTableProps {
  data: CurrencyWithActions[]
  onAdd: (data: { code: string; name: string }) => Promise<{ success: boolean; error?: string }>
  onEdit: (code: string, data: { name: string }) => Promise<{ success: boolean; error?: string }>
  onDelete: (code: string) => Promise<{ success: boolean; error?: string }>
}

export function CurrenciesTable({ data, onAdd, onEdit, onDelete }: CurrenciesTableProps) {
  const {
    isAddDialogOpen,
    isEditDialogOpen,
    setIsAddDialogOpen,
    setIsEditDialogOpen,
    formData,
    updateFormData,
    openAddDialog,
    openEditDialog,
    handleAdd,
    handleEdit,
    handleDelete,
  } = useCrudForm<CurrencyWithActions>({
    defaultFormData: { code: "", name: "" },
    onAdd: onAdd as any,
    onEdit: (id, data) => onEdit(id, { name: (data as any).name }),
    onDelete,
    successMessages: {
      add: "Currency added successfully",
      edit: "Currency updated successfully", 
      delete: "Currency deleted successfully",
    },
    errorMessages: {
      add: "Failed to add currency",
      edit: "Failed to update currency",
      delete: "Failed to delete currency",
    },
  })

  const columns: TableColumn<CurrencyWithActions>[] = [
    {
      key: "code",
      title: "Code",
      render: (currency) => (
        <Badge variant="secondary" className="font-mono">
          {currency.code}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "name",
      title: "Name",
      render: (currency) => (
        <span className="font-medium">{currency.name}</span>
      ),
      sortable: true,
    },
  ]

  return (
    <>
      <CrudTable
        data={data}
        columns={columns}
        onAdd={openAddDialog}
        onEdit={openEditDialog}
        onDelete={handleDelete}
        searchKey="name"
        searchPlaceholder="Search currencies..."
        addButtonText="Add Currency"
        enableRowSelection
      />

      {/* Add Dialog */}
      <FormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="Add Currency"
        description="Create a new currency for transaction tracking."
        onSubmit={handleAdd}
        submitText="Add Currency"
      >
        <FormField
          id="code"
          label="Code"
          value={formData.code || ""}
          onChange={(value) => updateFormData({ code: value })}
          placeholder="USD, EUR, GBP..."
          maxLength={3}
          transform={(value) => value.toUpperCase()}
          required
        />
        <FormField
          id="name"
          label="Name"
          value={formData.name || ""}
          onChange={(value) => updateFormData({ name: value })}
          placeholder="US Dollar, Euro..."
          required
        />
      </FormDialog>

      {/* Edit Dialog */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Currency"
        description="Make changes to the currency details."
        onSubmit={handleEdit}
        submitText="Save Changes"
      >
        <FormField
          id="edit-code"
          label="Code"
          value={formData.code || ""}
          onChange={() => {}}
          disabled
        />
        <FormField
          id="edit-name"
          label="Name"
          value={formData.name || ""}
          onChange={(value) => updateFormData({ name: value })}
          required
        />
      </FormDialog>
    </>
  )
}
