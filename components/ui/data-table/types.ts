import { ColumnDef, SortingState, ColumnFiltersState, VisibilityState, PaginationState, OnChangeFn } from "@tanstack/react-table"
import { ReactNode } from "react"

// Base interfaces
export interface BaseTableItem {
  id: string
  [key: string]: any
}

export interface EditableItem extends BaseTableItem {
  isEditable?: boolean
  isDeletable?: boolean
}

// Column configuration for simplified API
export interface TableColumn<T = any> {
  key: keyof T | string
  title: string
  render?: (item: T) => ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string
  className?: string
}

// Action interfaces
export interface TableAction<T = any> {
  label: string
  icon?: ReactNode
  onClick: (item: T) => void
  variant?: "default" | "destructive" | "secondary" | "ghost"
  show?: (item: T) => boolean
}

export interface BulkAction<T = any> {
  label: string
  icon?: ReactNode
  action: (selectedItems: T[]) => Promise<void>
  variant?: "default" | "destructive"
  requiresConfirmation?: boolean
  confirmationMessage?: string
}

// Main table props interface - supports both new API and legacy DataTable props
export interface TableProps<T extends BaseTableItem = BaseTableItem> {
  data: T[]
  
  // Column configuration - support both APIs
  columns?: TableColumn<T>[] // New simplified API
  
  // Selection
  enableRowSelection?: boolean
  enableMultiSelection?: boolean
  selectedRows?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  
  // Actions
  actions?: TableAction<T>[]
  bulkActions?: BulkAction<T>[]
  onRowClick?: (item: T) => void
  
  // Search & Filter
  searchable?: boolean
  searchKey?: keyof T | string
  searchPlaceholder?: string
  globalFilter?: string
  onGlobalFilterChange?: OnChangeFn<string>
  
  // Sorting
  sortable?: boolean
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  initialSorting?: SortingState // Legacy DataTable support
  
  // Pagination
  pagination?: boolean
  enablePagination?: boolean // Legacy DataTable support
  pageSize?: number
  pageSizeOptions?: number[]
  pageIndex?: number
  pageCount?: number
  onPaginationChange?: OnChangeFn<PaginationState>
  
  // State
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
  initialColumnFilters?: ColumnFiltersState // Legacy DataTable support
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>
  initialColumnVisibility?: VisibilityState // Legacy DataTable support
  
  // Loading & Empty States
  loading?: boolean
  emptyMessage?: string
  loadingComponent?: ReactNode
  emptyComponent?: ReactNode
  
  // Styling
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "ghost" | "outline"
  
  // Advanced
  enableColumnResizing?: boolean
  enableColumnReordering?: boolean
  stickyHeader?: boolean
  virtualScrolling?: boolean
  footer?: boolean
  
  // Custom Renderers
  renderToolbar?: (props: ToolbarProps<T>) => ReactNode
  renderRow?: (props: RowProps<T>) => ReactNode
  renderCell?: (props: CellProps<T>) => ReactNode
  renderRowActions?: (row: T) => ReactNode // Legacy DataTable support
}

// Legacy DataTable interface for backward compatibility
export interface DataTableProps<TData, TValue = unknown> extends Omit<TableProps<TData & BaseTableItem>, 'columns'> {
  columns: ColumnDef<TData, TValue>[] // Legacy react-table columns
}

export interface ToolbarProps<T> {
  table: any
  selectedRows: T[]
  searchValue: string
  onSearchChange: (value: string) => void
  bulkActions?: BulkAction<T>[]
}

export interface RowProps<T> {
  row: any
  item: T
  isSelected: boolean
  onSelect: (selected: boolean) => void
  actions?: TableAction<T>[]
  onClick?: () => void
}

export interface CellProps<T> {
  column: TableColumn<T>
  item: T
  value: any
}

export interface CrudTableProps<T extends EditableItem = EditableItem> extends Omit<TableProps<T>, 'actions'> {
  onAdd?: () => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onDuplicate?: (item: T) => void
  addButtonText?: string
  showAddButton?: boolean
  customActions?: TableAction<T>[]
}

export interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onSubmit: () => void
  submitText?: string
  children: ReactNode
  loading?: boolean
  size?: "sm" | "md" | "lg" | "xl"
}

export interface FieldConfig {
  id: string
  label: string
  type?: "text" | "email" | "password" | "number" | "textarea" | "select" | "checkbox" | "date" | "color"
  placeholder?: string
  value: any
  onChange: (value: any) => void
  required?: boolean
  disabled?: boolean
  options?: Array<{ label: string; value: any }>
  validation?: (value: any) => string | undefined
  showCharCount?: boolean
  maxLength?: number
  transform?: (value: any) => any
}

// Legacy types for backward compatibility (from old @/components/types/table)
export interface DataTableColumnHeaderProps<TData, TValue> {
  column: any
  title: string
  className?: string
}

export interface DataTablePaginationProps<TData> {
  table: any
  pageSizeOptions?: number[]
}
