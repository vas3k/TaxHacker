"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CircleCheck, Edit, Trash2 } from "lucide-react"
import { useOptimistic, useState } from "react"

interface CrudProps<T> {
  items: T[]
  columns: {
    key: keyof T
    label: string
    type?: "text" | "number" | "checkbox"
    editable?: boolean
  }[]
  onDelete: (id: string) => Promise<void>
  onAdd: (data: Partial<T>) => Promise<void>
  onEdit?: (id: string, data: Partial<T>) => Promise<void>
}

export function CrudTable<T extends { [key: string]: any }>({ items, columns, onDelete, onAdd, onEdit }: CrudProps<T>) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState<Partial<T>>({})
  const [editingItem, setEditingItem] = useState<Partial<T>>({})
  const [optimisticItems, addOptimisticItem] = useOptimistic(items, (state, newItem: T) => [...state, newItem])

  const handleAdd = async () => {
    try {
      await onAdd(newItem)
      setIsAdding(false)
      setNewItem({})
    } catch (error) {
      console.error("Failed to add item:", error)
    }
  }

  const handleEdit = async (id: string) => {
    if (!onEdit) return
    try {
      await onEdit(id, editingItem)
      setEditingId(null)
      setEditingItem({})
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
      await onDelete(id)
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
                  {editingId === (item.code || item.id) && column.editable ? (
                    <Input
                      type={column.type || "text"}
                      value={editingItem[column.key] || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          [column.key]: column.type === "checkbox" ? e.target.checked : e.target.value,
                        })
                      }
                    />
                  ) : column.type === "checkbox" ? (
                    item[column.key] ? (
                      <CircleCheck />
                    ) : (
                      ""
                    )
                  ) : (
                    item[column.key]
                  )}
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
                        <Button variant="ghost" size="icon" onClick={() => startEditing(item)}>
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
                  {column.editable && (
                    <Input
                      type={column.type || "text"}
                      value={newItem[column.key] || ""}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          [column.key]: column.type === "checkbox" ? e.target.checked : e.target.value,
                        })
                      }
                    />
                  )}
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
      {!isAdding && <Button onClick={() => setIsAdding(true)}>Add New</Button>}
    </div>
  )
}
