import { Field } from "@/prisma/client"

export interface FieldWithActions extends Field {
  isEditable: boolean
  isDeletable: boolean
}

export interface FieldTableColumn {
  key: keyof FieldWithActions
  label: string
  type?: "text" | "number" | "checkbox" | "select"
  options?: string[]
  defaultValue?: string | boolean
  editable?: boolean
  sortable?: boolean
  filterable?: boolean
}

export interface FieldEditState {
  isEditing: boolean
  rowId: string | null
  data: Partial<FieldWithActions>
}

export interface FieldTableState {
  editState: FieldEditState
  isAdding: boolean
  newFieldData: Partial<FieldWithActions>
}