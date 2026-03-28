"use client"

import { addFieldAction, deleteFieldAction, editFieldAction, reorderFieldsAction } from "@/app/(app)/settings/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Field, Prisma } from "@/prisma/client"
import { Check, Edit, GripVertical, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

interface FieldsSettingsFormProps {
  initialFields: (Field & { isEditable: boolean; isDeletable: boolean })[]
  userId: string
}

interface FieldFormData {
  name: string
  type: string
  llm_prompt: string
  isVisibleInList: boolean
  isVisibleInAnalysis: boolean
  isRequired: boolean
}

const defaultFormData: FieldFormData = {
  name: "",
  type: "string",
  llm_prompt: "",
  isVisibleInList: false,
  isVisibleInAnalysis: false,
  isRequired: false,
}

export default function FieldsSettingsForm({ initialFields, userId }: FieldsSettingsFormProps) {
  const [fields, setFields] = useState(initialFields)
  const [isAdding, setIsAdding] = useState(false)
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [newFieldData, setNewFieldData] = useState<FieldFormData>(defaultFormData)
  const [editingData, setEditingData] = useState<FieldFormData>(defaultFormData)
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = fields.findIndex((f) => f.code === active.id)
    const newIndex = fields.findIndex((f) => f.code === over.id)

    const newFields = arrayMove(fields, oldIndex, newIndex)
    setFields(newFields)

    // Save the new order
    startTransition(async () => {
      const fieldOrders = newFields.map((field, index) => ({
        code: field.code,
        order: index,
      }))
      await reorderFieldsAction(fieldOrders)
    })
  }

  const handleAdd = async () => {
    const result = await addFieldAction(userId, newFieldData as unknown as Prisma.FieldCreateInput)
    if (result.success) {
      setIsAdding(false)
      setNewFieldData(defaultFormData)
    } else {
      alert(result.error)
    }
  }

  const handleEdit = async (code: string) => {
    const result = await editFieldAction(userId, code, editingData as unknown as Prisma.FieldUpdateInput)
    if (result.success) {
      setEditingCode(null)
      setEditingData(defaultFormData)
    } else {
      alert(result.error)
    }
  }

  const handleDelete = async (code: string) => {
    const result = await deleteFieldAction(userId, code)
    if (!result.success) {
      alert(result.error)
    }
  }

  const startEditing = (field: Field) => {
    setEditingCode(field.code)
    setEditingData({
      name: field.name,
      type: field.type,
      llm_prompt: field.llm_prompt || "",
      isVisibleInList: field.isVisibleInList,
      isVisibleInAnalysis: field.isVisibleInAnalysis,
      isRequired: field.isRequired,
    })
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>LLM Prompt</TableHead>
              <TableHead>Show in list</TableHead>
              <TableHead>Show in analysis</TableHead>
              <TableHead>Required</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <SortableContext items={fields.map((f) => f.code)} strategy={verticalListSortingStrategy}>
            <TableBody>
              {fields.map((field) => (
                <SortableFieldRow
                  key={field.code}
                  field={field}
                  isEditing={editingCode === field.code}
                  editingData={editingData}
                  setEditingData={setEditingData}
                  onStartEdit={() => startEditing(field)}
                  onCancelEdit={() => setEditingCode(null)}
                  onSaveEdit={() => handleEdit(field.code)}
                  onDelete={() => handleDelete(field.code)}
                />
              ))}
              {isAdding && (
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={newFieldData.name}
                      onChange={(e) => setNewFieldData({ ...newFieldData, name: e.target.value })}
                      placeholder="Field name"
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      value={newFieldData.type}
                      className="p-2 rounded-md border bg-transparent"
                      onChange={(e) => setNewFieldData({ ...newFieldData, type: e.target.value })}
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={newFieldData.llm_prompt}
                      onChange={(e) => setNewFieldData({ ...newFieldData, llm_prompt: e.target.value })}
                      placeholder="LLM prompt"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={newFieldData.isVisibleInList}
                      onChange={(e) => setNewFieldData({ ...newFieldData, isVisibleInList: e.target.checked })}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={newFieldData.isVisibleInAnalysis}
                      onChange={(e) => setNewFieldData({ ...newFieldData, isVisibleInAnalysis: e.target.checked })}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={newFieldData.isRequired}
                      onChange={(e) => setNewFieldData({ ...newFieldData, isRequired: e.target.checked })}
                    />
                  </TableCell>
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
          </SortableContext>
        </Table>
      </DndContext>
      {!isAdding && (
        <Button
          onClick={() => {
            setIsAdding(true)
            setEditingCode(null)
          }}
        >
          Add New
        </Button>
      )}
      {isPending && <p className="text-sm text-muted-foreground">Saving order...</p>}
    </div>
  )
}

interface SortableFieldRowProps {
  field: Field & { isEditable: boolean; isDeletable: boolean }
  isEditing: boolean
  editingData: FieldFormData
  setEditingData: React.Dispatch<React.SetStateAction<FieldFormData>>
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
}

function SortableFieldRow({
  field,
  isEditing,
  editingData,
  setEditingData,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: SortableFieldRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.code,
  })

  const style = {
    transform: transform ? `translateY(${transform.y}px)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 rounded hover:bg-accent transition inline-flex items-center"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </span>
      </TableCell>
      <TableCell className="font-semibold">
        {isEditing ? (
          <Input
            type="text"
            value={editingData.name}
            onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
          />
        ) : (
          field.name
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <select
            value={editingData.type}
            className="p-2 rounded-md border bg-transparent"
            onChange={(e) => setEditingData({ ...editingData, type: e.target.value })}
          >
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
          </select>
        ) : (
          field.type
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="text"
            value={editingData.llm_prompt}
            onChange={(e) => setEditingData({ ...editingData, llm_prompt: e.target.value })}
          />
        ) : (
          field.llm_prompt
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <input
            type="checkbox"
            checked={editingData.isVisibleInList}
            onChange={(e) => setEditingData({ ...editingData, isVisibleInList: e.target.checked })}
          />
        ) : field.isVisibleInList ? (
          <Check />
        ) : null}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <input
            type="checkbox"
            checked={editingData.isVisibleInAnalysis}
            onChange={(e) => setEditingData({ ...editingData, isVisibleInAnalysis: e.target.checked })}
          />
        ) : field.isVisibleInAnalysis ? (
          <Check />
        ) : null}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <input
            type="checkbox"
            checked={editingData.isRequired}
            onChange={(e) => setEditingData({ ...editingData, isRequired: e.target.checked })}
          />
        ) : field.isRequired ? (
          <Check />
        ) : null}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={onSaveEdit}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              {field.isEditable && (
                <Button variant="ghost" size="icon" onClick={onStartEdit}>
                  <Edit />
                </Button>
              )}
              {field.isDeletable && (
                <Button variant="ghost" size="icon" onClick={onDelete}>
                  <Trash2 />
                </Button>
              )}
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
