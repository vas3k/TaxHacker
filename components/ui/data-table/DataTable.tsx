"use client"

import * as React from "react"
import { BaseTable } from "./BaseTable"
import { DataTableProps, BaseTableItem } from "./types"

// Compatibility wrapper that maintains exact DataTable API
export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  enableRowSelection = false,
  enableMultiSelection = false,
  onRowClick,
  renderRowActions,
  renderToolbar,
  initialSorting = [],
  initialColumnFilters = [],
  initialColumnVisibility = {},
  enablePagination = true,
  pageSizeOptions,
  className,
}: DataTableProps<TData, TValue>) {
  // Convert react-table columns to simplified TableColumn format
  const convertedColumns = React.useMemo(() => {
    return columns.map(col => ({
      key: (col as any).accessorKey || col.id || '',
      title: typeof col.header === 'string' ? col.header : col.id || '',
      render: col.cell ? (item: TData) => {
        // Create a mock cell context for the column cell renderer
        const cellContext = {
          getValue: () => (item as any)[(col as any).accessorKey],
          row: { original: item },
          column: col,
          table: null,
        }
        return typeof col.cell === 'function' ? col.cell(cellContext as any) : null
      } : undefined,
      sortable: (col as any).enableSorting !== false,
    }))
  }, [columns])

  // Convert data to ensure it has an id field
  const convertedData = React.useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      id: (item as any).id || (item as any).code || index.toString(),
    })) as (TData & BaseTableItem)[]
  }, [data])

  return (
    <BaseTable
      data={convertedData}
      columns={convertedColumns}
      searchKey={searchKey}
      searchPlaceholder={searchPlaceholder}
      enableRowSelection={enableRowSelection}
      enableMultiSelection={enableMultiSelection}
      onRowClick={onRowClick}
      renderToolbar={renderToolbar}
      initialSorting={initialSorting}
      initialColumnFilters={initialColumnFilters}
      initialColumnVisibility={initialColumnVisibility}
      enablePagination={enablePagination}
      pageSizeOptions={pageSizeOptions}
      className={className}
      // Add legacy row actions if provided
      actions={renderRowActions ? [{
        label: "Actions",
        onClick: () => {},
        render: renderRowActions
      } as any] : []}
    />
  )
}