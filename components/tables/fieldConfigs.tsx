"use client"

import { FormField } from "@/components/ui/data-table/FormField"
import { Badge } from "@/components/ui/badge"
import { randomHexColor } from "@/lib/utils"

export interface NamedEntityFormData {
  name: string
  llm_prompt: string | null
  color: string
}

export interface NamedEntityWithActions extends NamedEntityFormData {
  code?: string
  id?: string
  isEditable: boolean
  isDeletable: boolean
}

export const namedEntityFieldConfig = {
  defaultFormData: (): NamedEntityFormData => ({
    name: "",
    llm_prompt: "",
    color: randomHexColor(),
  }),

  resetFormData: (): NamedEntityFormData => ({
    name: "",
    llm_prompt: "",
    color: randomHexColor(),
  }),

  getColumns<T extends NamedEntityWithActions>(entityType: string) {
    return [
    {
      key: "name" as keyof T,
      title: "Name",
      render: (item: T) => (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border"
            style={{ backgroundColor: item.color }}
          />
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    {
      key: "llm_prompt" as keyof T,
      title: "LLM Prompt",
      render: (item: T) => {
        const prompt = item.llm_prompt
        if (!prompt) {
          return <span className="text-muted-foreground">No prompt</span>
        }
        return (
          <div className="max-w-[300px]" title={prompt}>
            {prompt.length > 20 ? (
              <div className="space-y-1">
                <div className="truncate">{prompt}</div>
                <div className="text-xs text-muted-foreground">
                  {prompt.length} characters (click edit to see full text)
                </div>
              </div>
            ) : (
              prompt
            )}
          </div>
        )
      },
    },
    {
      key: "color" as keyof T,
      title: "Color",
      render: (item: T) => (
        <Badge
          variant="outline"
          style={{ backgroundColor: item.color, color: "white" }}
        >
          {item.color}
        </Badge>
      ),
    },
  ]
  },

  getFormFields: (
    formData: NamedEntityFormData,
    updateFormData: (updates: Partial<NamedEntityFormData>) => void,
    entityType: string
  ) => [
    {
      id: "name",
      label: "Name",
      value: formData.name || "",
      onChange: (value: string) => updateFormData({ name: value }),
    },
    {
      id: "llm_prompt",
      label: "LLM Prompt",
      value: formData.llm_prompt || "",
      onChange: (value: string) => updateFormData({ llm_prompt: value }),
      type: "textarea" as const,
      placeholder: `Optional prompt for AI ${entityType.toLowerCase()} ${entityType === "Category" ? "categorization" : "detection"}`,
      showCharCount: true,
    },
    {
      id: "color",
      label: "Color",
      value: formData.color || "",
      onChange: (value: string) => updateFormData({ color: value }),
      type: "color" as const,
    },
  ],

  getMessages: (entityType: string) => ({
    searchPlaceholder: `Search ${entityType.toLowerCase()}s...`,
    addButtonText: `Add ${entityType}`,
    addTitle: `Add ${entityType}`,
    addDescription: `Create a new ${entityType.toLowerCase()} for organizing your ${entityType === "Category" ? "transactions" : "activities"}.`,
    editTitle: `Edit ${entityType}`,
    editDescription: `Make changes to the ${entityType.toLowerCase()} details.`,
    submitText: {
      add: `Add ${entityType}`,
      edit: "Save Changes",
    },
    successMessages: {
      add: `${entityType} added successfully`,
      edit: `${entityType} updated successfully`,
      delete: `${entityType} deleted successfully`,
    },
    errorMessages: {
      add: `Failed to add ${entityType.toLowerCase()}`,
      edit: `Failed to update ${entityType.toLowerCase()}`,
      delete: `Failed to delete ${entityType.toLowerCase()}`,
    },
  }),
}