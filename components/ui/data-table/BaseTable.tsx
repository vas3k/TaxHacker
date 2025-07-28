"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "./DataTableColumnHeader"
import { DataTablePagination } from "./DataTablePagination"
import { cn } from "@/lib/utils"
import { TableProps, BaseTableItem, TableColumn, TableAction, BulkAction } from "./types"
import { MoreHorizontal, Search, Loader2 } from "lucide-react"

export function BaseTable<T extends BaseTableItem>({
  data,
  columns: columnConfig = [],
  
  // Selection
  enableRowSelection = false,
  enableMultiSelection = true,
  selectedRows = [],
  onSelectionChange,
  
  // Actions
  actions = [],
  bulkActions = [],
  onRowClick,
  
  // Search & Filter
  searchable = true,
  searchKey,
  searchPlaceholder = "Search...",
  globalFilter = "",
  onGlobalFilterChange,
  
  // Sorting - support both new and legacy APIs
  sortable = true,
  sorting: externalSorting,
  onSortingChange: onExternalSortingChange,
  initialSorting = [],
  
  // Pagination - support both new and legacy APIs
  pagination = true,
  enablePagination,
  pageSize = 10,
  pageSizeOptions = [10, 20, 30, 40, 50],
  pageIndex = 0,
  pageCount,
  onPaginationChange: onExternalPaginationChange,
  
  // State - support both new and legacy APIs
  columnFilters: externalColumnFilters,
  onColumnFiltersChange: onExternalColumnFiltersChange,
  initialColumnFilters = [],
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange: onExternalColumnVisibilityChange,
  initialColumnVisibility = {},
  
  // Loading & Empty States
  loading = false,
  emptyMessage = "No results found.",
  loadingComponent,
  emptyComponent,
  
  // Styling
  className,
  size = "md",
  variant = "default",
  
  // Advanced
  stickyHeader = false,
  footer = false,
  
  // Custom Renderers
  renderToolbar,
  renderRow,
  renderCell,
  renderRowActions, // Legacy support
}: TableProps<T>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(initialSorting)
  const [internalColumnFilters, setInternalColumnFilters] = React.useState<ColumnFiltersState>(initialColumnFilters)
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>(initialColumnVisibility)
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
    pageIndex,
    pageSize,
  })
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState(globalFilter)
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})

  // Use external state if provided, otherwise use internal state
  const sorting = externalSorting ?? internalSorting
  const columnFilters = externalColumnFilters ?? internalColumnFilters
  const columnVisibility = externalColumnVisibility ?? internalColumnVisibility
  const paginationState = onExternalPaginationChange ? { pageIndex, pageSize } : internalPagination
  const currentGlobalFilter = onGlobalFilterChange ? globalFilter : internalGlobalFilter

  // Simplified state setters
  const setSorting: OnChangeFn<SortingState> = onExternalSortingChange ?? setInternalSorting
  const setColumnFilters: OnChangeFn<ColumnFiltersState> = onExternalColumnFiltersChange ?? setInternalColumnFilters
  const setColumnVisibility: OnChangeFn<VisibilityState> = onExternalColumnVisibilityChange ?? setInternalColumnVisibility
  const setPagination: OnChangeFn<PaginationState> = onExternalPaginationChange ?? setInternalPagination
  const setGlobalFilter: OnChangeFn<string> = onGlobalFilterChange ?? setInternalGlobalFilter

  // Note: External selection sync disabled to prevent infinite loops
  // Current table implementations use internal selection state only

  // Create columns with selection and actions
  const columns = React.useMemo<ColumnDef<T>[]>(() => {
    const cols: ColumnDef<T>[] = []

    // Selection column
    if (enableRowSelection) {
      cols.push({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      })
    }

    // Data columns
    columnConfig.forEach((col) => {
      if (!col || !col.key) return // Skip invalid columns
      
      cols.push({
        accessorKey: col.key as string,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={col.title}
            className={col.className}
          />
        ),
        cell: ({ row }) => {
          const value = row.getValue(col.key as string)
          if (renderCell) {
            return renderCell({ column: col, item: row.original, value })
          }
          return col.render ? col.render(row.original) : value
        },
        enableSorting: sortable && (col.sortable !== false),
        enableHiding: true,
        size: col.width ? parseInt(col.width) : undefined,
      })
    })

    // Actions column
    if (actions.length > 0) {
      cols.push({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const item = row.original
          const visibleActions = actions.filter(action => !action.show || action.show(item))
          
          if (visibleActions.length === 0) return null
          
          if (visibleActions.length === 1) {
            const action = visibleActions[0]
            return (
              <Button
                variant={action.variant ?? "ghost"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  action.onClick(item)
                }}
              >
                {action.icon}
                {action.label}
              </Button>
            )
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {visibleActions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => action.onClick(item)}
                    className={action.variant === "destructive" ? "text-destructive" : ""}
                  >
                    {action.icon}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
        enableSorting: false,
        enableHiding: false,
        size: actions.length === 1 ? 100 : 50,
      })
    }

    return cols
  }, [columnConfig, actions, enableRowSelection, sortable, renderCell])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: currentGlobalFilter,
      ...((pagination || enablePagination) && { pagination: paginationState }),
    },
    enableRowSelection,
    enableMultiRowSelection: enableMultiSelection,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater
      setRowSelection(newSelection)
      
      if (onSelectionChange) {
        const selectedIds = Object.keys(newSelection).filter(key => newSelection[key])
        onSelectionChange(selectedIds)
      }
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    ...((pagination || enablePagination) && { onPaginationChange: setPagination }),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...((pagination || enablePagination) && { getPaginationRowModel: getPaginationRowModel() }),
    getSortedRowModel: getSortedRowModel(),
    ...(pageCount && { pageCount }),
    debugTable: process.env.NODE_ENV === "development",
  })

  const selectedItems = React.useMemo(() => {
    return Object.keys(rowSelection)
      .filter(key => rowSelection[key])
      .map(id => data.find(item => item.id === id))
      .filter(Boolean) as T[]
  }, [rowSelection, data])

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  const defaultToolbar = (
    <div className="flex items-center justify-between py-4">
      <div className="flex flex-1 items-center space-x-2">
        {searchable && searchKey && (
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey as string)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey as string)?.setFilterValue(event.target.value)
              }
              className="pl-8"
            />
          </div>
        )}
        {searchable && !searchKey && (
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={currentGlobalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8"
            />
          </div>
        )}
      </div>
      
      {selectedItems.length > 0 && bulkActions.length > 0 && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {selectedItems.length} selected
          </span>
          {bulkActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant ?? "default"}
              size="sm"
              onClick={() => action.action(selectedItems)}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className={cn("space-y-4", className)}>
      {renderToolbar ? renderToolbar({
        table,
        selectedRows: selectedItems,
        searchValue: currentGlobalFilter,
        onSearchChange: setGlobalFilter,
        bulkActions,
      }) : defaultToolbar}

      <div className={cn(
        "rounded-md border",
        variant === "ghost" && "border-transparent",
        variant === "outline" && "border-border"
      )}>
        <Table>
          <TableHeader className={stickyHeader ? "sticky top-0 bg-background" : ""}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={sizeClasses[size]}>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {loadingComponent || (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                if (renderRow) {
                  return renderRow({
                    row,
                    item: row.original,
                    isSelected: row.getIsSelected(),
                    onSelect: (selected) => row.toggleSelected(selected),
                    actions,
                    onClick: onRowClick ? () => onRowClick(row.original) : undefined,
                  })
                }
                
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={onRowClick ? "cursor-pointer" : ""}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyComponent || emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {footer && (
            <TableRow>
              {columns.map((column, index) => (
                <TableCell key={index}>
                  {/* Footer content can be added here */}
                </TableCell>
              ))}
            </TableRow>
          )}
        </Table>
      </div>

      {(pagination || enablePagination) && (
        <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
      )}
    </div>
  )
}
