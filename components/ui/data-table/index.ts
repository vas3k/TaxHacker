// Main table components
export { BaseTable } from "./BaseTable"
export { CrudTable } from "./CrudTable"
export { DataTable } from "./DataTable" // Compatibility wrapper

// Form components
export { FormDialog } from "./FormDialog"
export { FormField } from "./FormField"
export { ColumnVisibilitySelector } from "./ColumnVisibilitySelector"

// Legacy components (maintained for backward compatibility only)
export { DataTableColumnHeader } from "./DataTableColumnHeader"
export { DataTablePagination } from "./DataTablePagination"

// Hooks
export { useCrudForm } from "./hooks/useCrudForm"

// Types
export type {
  BaseTableItem,
  EditableItem,
  TableColumn,
  TableAction,
  BulkAction,
  TableProps,
  CrudTableProps,
  FormDialogProps,
  FieldConfig,
  ToolbarProps,
  RowProps,
  CellProps,
  DataTableProps, // Legacy compatibility
  // Legacy types from old @/components/types/table
  DataTableColumnHeaderProps,
  DataTablePaginationProps,
} from "./types"