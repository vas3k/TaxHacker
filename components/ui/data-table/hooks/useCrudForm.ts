"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

interface CrudFormConfig<T> {
  defaultFormData: Partial<T>
  onAdd?: (data: Partial<T>) => Promise<{ success: boolean; error?: string }>
  onEdit?: (id: string, data: Partial<T>) => Promise<{ success: boolean; error?: string }>
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>
  successMessages?: {
    add?: string
    edit?: string
    delete?: string
  }
  errorMessages?: {
    add?: string
    edit?: string
    delete?: string
  }
  resetFormData?: () => Partial<T>
}

export function useCrudForm<T extends { id?: string; code?: string }>({
  defaultFormData,
  onAdd,
  onEdit,
  onDelete,
  successMessages = {},
  errorMessages = {},
  resetFormData,
}: CrudFormConfig<T>) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState<Partial<T>>(defaultFormData)
  const [editingItem, setEditingItem] = useState<T | null>(null)

  const updateFormData = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const resetForm = useCallback(() => {
    const resetData = resetFormData ? resetFormData() : defaultFormData
    setFormData(resetData)
    setEditingItem(null)
  }, [defaultFormData, resetFormData])

  const openAddDialog = useCallback(() => {
    resetForm()
    setIsAddDialogOpen(true)
  }, [resetForm])

  const openEditDialog = useCallback((item: T) => {
    setFormData(item)
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }, [])

  const handleAdd = useCallback(async () => {
    if (!onAdd) return
    
    try {
      const result = await onAdd(formData)
      if (result.success) {
        toast.success(successMessages.add || "Item added successfully")
        setIsAddDialogOpen(false)
        resetForm()
      } else {
        toast.error(result.error || errorMessages.add || "Failed to add item")
      }
    } catch (error) {
      toast.error(errorMessages.add || "Failed to add item")
    }
  }, [formData, onAdd, successMessages.add, errorMessages.add, resetForm])

  const handleEdit = useCallback(async () => {
    if (!onEdit || !editingItem) return
    
    try {
      // Prefer code over id for business entity identification
      const id = editingItem.code || editingItem.id || ""
      const result = await onEdit(id, formData)
      if (result.success) {
        toast.success(successMessages.edit || "Item updated successfully")
        setIsEditDialogOpen(false)
        resetForm()
      } else {
        toast.error(result.error || errorMessages.edit || "Failed to update item")
      }
    } catch (error) {
      toast.error(errorMessages.edit || "Failed to update item")
    }
  }, [formData, editingItem, onEdit, successMessages.edit, errorMessages.edit, resetForm])

  const handleDelete = useCallback(async (item: T) => {
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      // Prefer code over id for business entity identification
      const id = item.code || item.id || ""
      const result = await onDelete(id)
      if (result.success) {
        toast.success(successMessages.delete || "Item deleted successfully")
      } else {
        toast.error(result.error || errorMessages.delete || "Failed to delete item")
      }
    } catch (error) {
      toast.error(errorMessages.delete || "Failed to delete item")
    } finally {
      setIsDeleting(false)
    }
  }, [onDelete, successMessages.delete, errorMessages.delete])

  return {
    // Dialog states
    isAddDialogOpen,
    isEditDialogOpen,
    setIsAddDialogOpen,
    setIsEditDialogOpen,
    
    // Form data
    formData,
    updateFormData,
    resetForm,
    
    // Actions
    openAddDialog,
    openEditDialog,
    handleAdd,
    handleEdit,
    handleDelete,
    
    // Loading states
    isDeleting,
    
    // Current editing item
    editingItem,
  }
}
