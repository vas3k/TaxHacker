"use client"

import { CrudTable, FormDialog, FormField, useCrudForm, type TableColumn, type EditableItem } from "@/components/ui/data-table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { fieldsFieldConfig, FieldsFormData } from "./fieldConfigs"
import { FieldWithActions } from "./types"

type FieldWithEditableActions = FieldWithActions & EditableItem

interface FieldsTableProps {
  fields: FieldWithEditableActions[]
  onAdd: (data: Partial<FieldWithEditableActions>) => Promise<{ success: boolean; error?: string }>
  onEdit: (code: string, data: Partial<FieldWithEditableActions>) => Promise<{ success: boolean; error?: string }>
  onDelete: (code: string) => Promise<{ success: boolean; error?: string }>
}

export function FieldsTable({ fields, onAdd, onEdit, onDelete }: FieldsTableProps) {
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
  } = useCrudForm<FieldWithEditableActions>({
    defaultFormData: fieldsFieldConfig.defaultFormData(),
    onAdd: onAdd as any,
    onEdit,
    onDelete,
    successMessages: {
      add: "Field added successfully",
      edit: "Field updated successfully",
      delete: "Field deleted successfully"
    },
    errorMessages: {
      add: "Failed to add field",
      edit: "Failed to update field",
      delete: "Failed to delete field"
    }
  })

  const columns: TableColumn<FieldWithEditableActions>[] = fieldsFieldConfig.getColumns<FieldWithEditableActions>()
  const formFields = fieldsFieldConfig.getFormFields(
    formData as FieldsFormData,
    updateFormData as (updates: Partial<FieldsFormData>) => void
  )

  return (
    <>
      <CrudTable
        data={fields}
        columns={columns}
        onAdd={openAddDialog}
        onEdit={openEditDialog}
        onDelete={handleDelete}
        searchKey="name"
        searchPlaceholder="Search fields..."
        addButtonText="Add Field"
        enableRowSelection
      />
      {/* Add Dialog */}
      <FormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="Add Field"
        description="Add a new custom field for transaction data extraction."
        onSubmit={handleAdd}
        submitText="Add Field"
      >
        {formFields.map((field: any) => (
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
        
        {/* Type Select */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="type" className="text-right">
            Field Type
          </Label>
          <div className="col-span-3">
            <Select
              value={formData.type || "string"}
              onValueChange={(value) => updateFormData({ type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Options</Label>
          <div className="col-span-3 space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVisibleInList"
                checked={formData.isVisibleInList || false}
                onCheckedChange={(checked) => updateFormData({ isVisibleInList: checked as boolean })}
              />
              <Label htmlFor="isVisibleInList" className="text-sm font-normal">
                Show in Transaction Table
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVisibleInAnalysis"
                checked={formData.isVisibleInAnalysis || false}
                onCheckedChange={(checked) => updateFormData({ isVisibleInAnalysis: checked as boolean })}
              />
              <Label htmlFor="isVisibleInAnalysis" className="text-sm font-normal">
                Show in Analysis
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRequired"
                checked={formData.isRequired || false}
                onCheckedChange={(checked) => updateFormData({ isRequired: checked as boolean })}
              />
              <Label htmlFor="isRequired" className="text-sm font-normal">
                Required Field
              </Label>
            </div>
          </div>
        </div>
      </FormDialog>

      {/* Edit Dialog */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Field"
        description="Modify the field configuration."
        onSubmit={handleEdit}
        submitText="Update Field"
      >
        {formFields.map((field: any) => (
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
        
        {/* Type Select */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-type" className="text-right">
            Field Type
          </Label>
          <div className="col-span-3">
            <Select
              value={formData.type || "string"}
              onValueChange={(value) => updateFormData({ type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Options</Label>
          <div className="col-span-3 space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isVisibleInList"
                checked={formData.isVisibleInList || false}
                onCheckedChange={(checked) => updateFormData({ isVisibleInList: checked as boolean })}
              />
              <Label htmlFor="edit-isVisibleInList" className="text-sm font-normal">
                Show in Transaction Table
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isVisibleInAnalysis"
                checked={formData.isVisibleInAnalysis || false}
                onCheckedChange={(checked) => updateFormData({ isVisibleInAnalysis: checked as boolean })}
              />
              <Label htmlFor="edit-isVisibleInAnalysis" className="text-sm font-normal">
                Show in Analysis
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isRequired"
                checked={formData.isRequired || false}
                onCheckedChange={(checked) => updateFormData({ isRequired: checked as boolean })}
              />
              <Label htmlFor="edit-isRequired" className="text-sm font-normal">
                Required Field
              </Label>
            </div>
          </div>
        </div>
      </FormDialog>
    </>
  )
}