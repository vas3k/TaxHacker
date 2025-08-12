"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, Edit, Trash2 } from "lucide-react"
import { useOptimistic, useState } from "react"

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
}

export function CrudTable<T extends { [key: string]: any }>({ items, columns, onDelete, onAdd, onEdit }: CrudProps<T>) {
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

  return (
    <div className="space-y-4">
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
                      <Button size="sm" onClick={() => handleEdit(item.code || item.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
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
                        >
                          <Edit />
                        </Button>
                      )}
                      {item.isDeletable && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.code || item.id)}>
                          <Trash2 />
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
                  <Button size="sm" onClick={handleAdd}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
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
