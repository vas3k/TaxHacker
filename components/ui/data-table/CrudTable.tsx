"use client"

import * as React from "react"
import { BaseTable } from "./BaseTable"
import { Button } from "@/components/ui/button"
import { CrudTableProps, EditableItem, TableAction } from "./types"
import { ColumnVisibilitySelector } from "./ColumnVisibilitySelector"
import { Edit, Trash2, Plus, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

export function CrudTable<T extends EditableItem>({
  onAdd,
  onEdit,
  onDelete,
  onDuplicate,
  addButtonText = "Add Item",
  showAddButton = true,
  customActions = [],
  ...tableProps
}: CrudTableProps<T>) {
  const actions = React.useMemo<TableAction<T>[]>(() => {
    const crudActions: TableAction<T>[] = []

    // Edit action
    if (onEdit) {
      crudActions.push({
        label: "Edit",
        icon: <Edit className="mr-2 h-4 w-4" />,
        onClick: onEdit,
        variant: "ghost",
        show: (item) => item.isEditable !== false,
      })
    }

    // Duplicate action
    if (onDuplicate) {
      crudActions.push({
        label: "Duplicate",
        icon: <Copy className="mr-2 h-4 w-4" />,
        onClick: onDuplicate,
        variant: "ghost",
      })
    }

    // Delete action
    if (onDelete) {
      crudActions.push({
        label: "Delete",
        icon: <Trash2 className="mr-2 h-4 w-4" />,
        onClick: onDelete,
        variant: "destructive",
        show: (item) => item.isDeletable !== false,
      })
    }

    return [...customActions, ...crudActions]
  }, [onEdit, onDelete, onDuplicate, customActions])

  const renderToolbar = React.useCallback(
    (props: any) => (
      <div className="flex flex-col space-y-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-1 items-center space-x-2">
          {/* Use BaseTable's built-in search */}
          {props.searchValue !== undefined && (
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                placeholder={tableProps.searchPlaceholder || "Search..."}
                value={props.searchValue}
                onChange={(e) => props.onSearchChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
          {/* Bulk actions are handled by BaseTable */}
          {props.selectedRows.length > 0 && props.bulkActions && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {props.selectedRows.length} selected
              </span>
              {props.bulkActions.map((action: any, index: number) => (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  size="sm"
                  onClick={() => action.action(props.selectedRows)}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <ColumnVisibilitySelector table={props.table} />
            
            {showAddButton && onAdd && (
              <Button onClick={onAdd} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {addButtonText}
              </Button>
            )}
          </div>
        </div>
      </div>
    ),
    [onAdd, addButtonText, showAddButton, tableProps.searchPlaceholder]
  )

  return (
    <BaseTable<T>
      {...tableProps}
      actions={actions}
      renderToolbar={renderToolbar}
    />
  )
}
