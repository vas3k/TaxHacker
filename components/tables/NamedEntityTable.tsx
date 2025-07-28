"use client"

import { CrudTable, FormDialog, FormField, useCrudForm, type TableColumn, type EditableItem } from "@/components/ui/data-table"
import { 
  namedEntityFieldConfig, 
  NamedEntityFormData, 
  NamedEntityWithActions 
} from "./fieldConfigs"

type NamedEntityWithEditableActions = NamedEntityWithActions & EditableItem

interface NamedEntityTableProps<T extends NamedEntityWithEditableActions> {
  data: T[]
  entityType: "Category" | "Project"
  onAdd: (data: Partial<T>) => Promise<{ success: boolean; error?: string }>
  onEdit: (code: string, data: Partial<T>) => Promise<{ success: boolean; error?: string }>
  onDelete: (code: string) => Promise<{ success: boolean; error?: string }>
}

export function NamedEntityTable<T extends NamedEntityWithEditableActions>({ 
  data, 
  entityType,
  onAdd, 
  onEdit, 
  onDelete 
}: NamedEntityTableProps<T>) {
  const messages = namedEntityFieldConfig.getMessages(entityType)
  
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
  } = useCrudForm<T>({
    defaultFormData: namedEntityFieldConfig.defaultFormData() as Partial<T>,
    onAdd: onAdd as any,
    onEdit,
    onDelete,
    successMessages: messages.successMessages,
    errorMessages: messages.errorMessages,
  })

  const columns: TableColumn<T>[] = namedEntityFieldConfig.getColumns<T>(entityType)
  const formFields = namedEntityFieldConfig.getFormFields(
    formData as NamedEntityFormData,
    updateFormData as (updates: Partial<NamedEntityFormData>) => void,
    entityType
  )

  return (
    <>
      <CrudTable
        data={data}
        columns={columns}
        onAdd={openAddDialog}
        onEdit={openEditDialog}
        onDelete={handleDelete}
        searchKey="name"
        searchPlaceholder={messages.searchPlaceholder}
        addButtonText={messages.addButtonText}
        enableRowSelection
      />
      {/* Add Dialog */}
      <FormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title={messages.addTitle}
        description={messages.addDescription}
        onSubmit={handleAdd}
        submitText={messages.submitText.add}
      >
        {formFields.map((field) => (
          <FormField
            key={field.id}
            id={field.id}
            label={field.label}
            value={field.value}
            onChange={field.onChange}
            type={field.type}
            placeholder={field.placeholder}
            showCharCount={field.showCharCount}
          />
        ))}
      </FormDialog>

      {/* Edit Dialog */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title={messages.editTitle}
        description={messages.editDescription}
        onSubmit={handleEdit}
        submitText={messages.submitText.edit}
      >
        {formFields.map((field) => (
          <FormField
            key={`edit-${field.id}`}
            id={`edit-${field.id}`}
            label={field.label}
            value={field.value}
            onChange={field.onChange}
            type={field.type}
            placeholder={field.placeholder}
            showCharCount={field.showCharCount}
          />
        ))}
      </FormDialog>
    </>
  )
}