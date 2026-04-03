"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, Edit, GitMerge, Search, Trash2 } from "lucide-react"
import { useOptimistic, useState } from "react"
import { toast } from "sonner"

interface CrudColumn<T> {
  key: keyof T
  label: string
  type?: "text" | "number" | "checkbox" | "select" | "color"
  options?: string[]
  defaultValue?: string | boolean
  editable?: boolean
}

interface CrudProps<T> {
  items: T[]
  columns: CrudColumn<T>[]
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>
  onAdd: (data: Partial<T>) => Promise<{ success: boolean; error?: string }>
  onEdit?: (id: string, data: Partial<T>) => Promise<{ success: boolean; error?: string }>
  onMerge?: (sourceId: string, targetId: string) => Promise<{ success: boolean; data?: any; error?: string }>
  onUndoMerge?: (data: any, transactionIds: string[]) => Promise<{ success: boolean; error?: string }>
}

export function CrudTable<T extends { [key: string]: any }>({ items, columns, onDelete, onAdd, onEdit, onMerge, onUndoMerge }: CrudProps<T>) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState<Partial<T>>(itemDefaults(columns))
  const [editingItem, setEditingItem] = useState<Partial<T>>(itemDefaults(columns))
  const [optimisticItems, addOptimisticItem] = useOptimistic(items, (state, newItem: T) => [...state, newItem])

  const FormCell = (item: T, column: CrudColumn<T>) => {
    if (column.type === "checkbox") {
      return item[column.key] ? <Check /> : ""
    }
    if (column.type === "color" || column.key === "color") {
      const value = (item[column.key] as string) || ""
      return (
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: value || "#ffffff" }} />
          <span>{value}</span>
        </div>
      )
    }
    return item[column.key]
  }

  const EditFormCell = (item: T, column: CrudColumn<T>) => {
    if (column.type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={editingItem[column.key]}
          aria-label={String(column.label)}
          onChange={(e) =>
            setEditingItem({
              ...editingItem,
              [column.key]: e.target.checked,
            })
          }
        />
      )
    } else if (column.type === "select") {
      return (
        <select
          value={editingItem[column.key]}
          className="p-2 rounded-md border bg-transparent"
          aria-label={String(column.label)}
          onChange={(e) =>
            setEditingItem({
              ...editingItem,
              [column.key]: e.target.value,
            })
          }
        >
          {column.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    } else if (column.type === "color" || column.key === "color") {
      return (
        <div className="flex items-center gap-2">
          <div className="relative">
            <span
              className="block h-4 w-4 rounded-full border"
              style={{ backgroundColor: (editingItem[column.key] as string) || "#000" }}
            />
            <input
              type="color"
              className="absolute inset-0 h-4 w-4 opacity-0 cursor-pointer"
              value={(editingItem[column.key] as string) || "#000"}
              onChange={(e) =>
                setEditingItem({
                  ...editingItem,
                  [column.key]: e.target.value,
                })
              }
            />
          </div>
          <Input
            type="text"
            value={(editingItem[column.key] as string) || ""}
            aria-label={String(column.label)}
            onChange={(e) =>
              setEditingItem({
                ...editingItem,
                [column.key]: e.target.value,
              })
            }
            placeholder="#FFFFFF"
          />
        </div>
      )
    }

    return (
      <Input
        type="text"
        value={editingItem[column.key] || ""}
        aria-label={String(column.label)}
        onChange={(e) =>
          setEditingItem({
            ...editingItem,
            [column.key]: e.target.value,
          })
        }
      />
    )
  }

  const AddFormCell = (column: CrudColumn<T>) => {
    if (column.type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={Boolean(newItem[column.key] || column.defaultValue)}
          aria-label={String(column.label)}
          onChange={(e) =>
            setNewItem({
              ...newItem,
              [column.key]: e.target.checked,
            })
          }
        />
      )
    } else if (column.type === "select") {
      return (
        <select
          value={String(newItem[column.key] || column.defaultValue || "")}
          className="p-2 rounded-md border bg-transparent"
          aria-label={String(column.label)}
          onChange={(e) =>
            setNewItem({
              ...newItem,
              [column.key]: e.target.value,
            })
          }
        >
          {column.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    } else if (column.type === "color" || column.key === "color") {
      return (
        <div className="flex items-center gap-2">
          <div className="relative">
            <span
              className="block h-4 w-4 rounded-full border"
              style={{ backgroundColor: String(newItem[column.key] || column.defaultValue || "#000") }}
            />
            <input
              type="color"
              className="absolute inset-0 h-4 w-4 opacity-0 cursor-pointer"
              value={String(newItem[column.key] || column.defaultValue || "#000")}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  [column.key]: e.target.value,
                })
              }
            />
          </div>
          <Input
            type="text"
            value={String(newItem[column.key] || column.defaultValue || "")}
            aria-label={String(column.label)}
            onChange={(e) =>
              setNewItem({
                ...newItem,
                [column.key]: e.target.value,
              })
            }
            placeholder="#FFFFFF"
          />
        </div>
      )
    }
    return (
      <Input
        type={column.type || "text"}
        value={String(newItem[column.key] || column.defaultValue || "")}
        aria-label={String(column.label)}
        onChange={(e) =>
          setNewItem({
            ...newItem,
            [column.key]: e.target.value,
          })
        }
      />
    )
  }

  const handleAdd = async () => {
    try {
      const result = await onAdd(newItem)
      if (result.success) {
        setIsAdding(false)
        setNewItem(itemDefaults(columns))
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error("Failed to add item:", error)
    }
  }

  const handleEdit = async (id: string) => {
    if (!onEdit) return
    try {
      const result = await onEdit(id, editingItem)
      if (result.success) {
        setEditingId(null)
        setEditingItem({})
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error("Failed to edit item:", error)
    }
  }

  const startEditing = (item: T) => {
    setEditingId(item.code || item.id)
    setEditingItem(item)
  }

  const handleDelete = async (id: string) => {
    try {
      const result = await onDelete(id)
      if (!result.success) {
        alert(result.error)
      }
    } catch (error) {
      console.error("Failed to delete item:", error)
    }
  }

  const [mergeSource, setMergeSource] = useState<T | null>(null)
  const [mergeSearch, setMergeSearch] = useState("")

  const handleMerge = async (targetId: string) => {
    if (!mergeSource || !onMerge || !onUndoMerge) return

    const sourceId = mergeSource.code || mergeSource.id
    try {
      const result = await onMerge(sourceId, targetId)
      if (result.success) {
        setMergeSource(null)
        toast.success("Projects merged successfully", {
          action: {
            label: "Undo",
            onClick: async () => {
              const undoResult = await onUndoMerge(result.data.sourceProject, result.data.transactionIds)
              if (undoResult.success) {
                toast.success("Merge undone")
              } else {
                toast.error(undoResult.error)
              }
            },
          },
        })
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error("Failed to merge items:", error)
      toast.error("Failed to merge items")
    }
  }

  const filteredMergeTargets = items.filter(
    (item) =>
      (item.code || item.id) !== (mergeSource?.code || mergeSource?.id) &&
      (item.name || "").toLowerCase().includes(mergeSearch.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <Dialog open={!!mergeSource} onOpenChange={(open) => !open && setMergeSource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge {mergeSource?.name || "Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a project to merge <strong>{mergeSource?.name}</strong> into. All transactions will be moved to the
              selected project, and <strong>{mergeSource?.name}</strong> will be deleted.
            </p>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={mergeSearch}
                onChange={(e) => setMergeSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1 border rounded-md p-2">
              {filteredMergeTargets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No projects found</p>
              ) : (
                filteredMergeTargets.map((item) => (
                  <Button
                    key={item.code || item.id}
                    variant="ghost"
                    className="w-full justify-start font-normal"
                    onClick={() => handleMerge(item.code || item.id)}
                  >
                    {item.name}
                  </Button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.key)}>{column.label}</TableHead>
            ))}
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {optimisticItems.map((item, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={String(column.key)} className="first:font-semibold">
                  {editingId === (item.code || item.id) && column.editable
                    ? EditFormCell(item, column)
                    : FormCell(item, column)}
                </TableCell>
              ))}
              <TableCell>
                <div className="flex gap-2">
                  {editingId === (item.code || item.id) ? (
                    <>
                      <Button size="sm" onClick={() => handleEdit(item.code || item.id)} aria-label="Save changes">
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} aria-label="Cancel editing">
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            startEditing(item)
                            setIsAdding(false)
                          }}
                          aria-label={`Edit ${String(item.name || item.code || 'item')}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onMerge && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setMergeSource(item)
                            setMergeSearch("")
                          }}
                          aria-label={`Merge ${String(item.name || item.code || 'item')}`}
                        >
                          <GitMerge className="h-4 w-4" />
                        </Button>
                      )}
                      {item.isDeletable && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.code || item.id)}
                          aria-label={`Delete ${String(item.name || item.code || 'item')}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {isAdding && (
            <TableRow>
              {columns.map((column) => (
                <TableCell key={String(column.key)} className="first:font-semibold">
                  {column.editable && AddFormCell(column)}
                </TableCell>
              ))}
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAdd} aria-label="Save new item">
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsAdding(false)} aria-label="Cancel adding new item">
                    Cancel
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {!isAdding && (
        <Button
          onClick={() => {
            setIsAdding(true)
            setEditingId(null)
          }}
          aria-label="Add new item"
        >
          Add New
        </Button>
      )}
    </div>
  )
}
function itemDefaults<T>(columns: CrudColumn<T>[]) {
  return columns.reduce((acc, column) => {
    acc[column.key] = column.defaultValue as T[keyof T]
    return acc
  }, {} as Partial<T>)
}
