"use client"

import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { FieldWithActions } from "./types"

export interface FieldsFormData {
  name: string
  type: string
  llm_prompt: string
  isVisibleInList: boolean
  isVisibleInAnalysis: boolean
  isRequired: boolean
  isExtra: boolean
  isEditable: boolean
  isDeletable: boolean
}

export const fieldsFieldConfig = {
  defaultFormData(): Partial<FieldWithActions> {
    return {
      name: "",
      type: "string",
      llm_prompt: "",
      isVisibleInList: false,
      isVisibleInAnalysis: false,
      isRequired: false,
      isExtra: true,
      isEditable: true,
      isDeletable: true
    }
  },

  resetFormData(): Partial<FieldWithActions> {
    return {
      name: "",
      type: "string",
      llm_prompt: "",
      isVisibleInList: false,
      isVisibleInAnalysis: false,
      isRequired: false,
      isExtra: true,
      isEditable: true,
      isDeletable: true
    }
  },

  getColumns<T extends FieldWithActions>() {
    return [
      {
        key: "name" as keyof T,
        title: "Name",
        render: (item: T) => (
          <span className="font-medium">{item.name}</span>
        ),
      },
      {
        key: "type" as keyof T,
        title: "Type",
        render: (item: T) => (
          <Badge variant="secondary" className="capitalize">
            {item.type}
          </Badge>
        ),
      },
      {
        key: "llm_prompt" as keyof T,
        title: "LLM Prompt",
        render: (item: T) => {
          const prompt = item.llm_prompt
          if (!prompt) {
            return <span className="text-muted-foreground">Manual entry</span>
          }
          return (
            <div className="max-w-[300px]" title={prompt}>
              {prompt.length > 40 ? (
                <div className="space-y-1">
                  <div className="truncate">{prompt}</div>
                  <div className="text-xs text-muted-foreground">
                    {prompt.length} characters
                  </div>
                </div>
              ) : (
                <span className="text-sm">{prompt}</span>
              )}
            </div>
          )
        },
      },
      {
        key: "isVisibleInList" as keyof T,
        title: "In Table",
        render: (item: T) => (
          <div className="flex justify-center">
            {item.isVisibleInList ? <Check className="h-4 w-4 text-green-600" /> : null}
          </div>
        ),
      },
      {
        key: "isVisibleInAnalysis" as keyof T,
        title: "In Analysis",
        render: (item: T) => (
          <div className="flex justify-center">
            {item.isVisibleInAnalysis ? <Check className="h-4 w-4 text-green-600" /> : null}
          </div>
        ),
      },
      {
        key: "isRequired" as keyof T,
        title: "Required",
        render: (item: T) => (
          <div className="flex justify-center">
            {item.isRequired ? <Check className="h-4 w-4 text-green-600" /> : null}
          </div>
        ),
      },
    ]
  },

  getFormFields(
    formData: FieldsFormData,
    updateFormData: (updates: Partial<FieldsFormData>) => void
  ) {
    return [
      {
        id: "name",
        label: "Field Name",
        value: formData.name || "",
        onChange: (value: string) => updateFormData({ name: value }),
        placeholder: "Enter field name",
      },
      {
        id: "llm_prompt",
        label: "LLM Prompt",
        value: formData.llm_prompt || "",
        onChange: (value: string) => updateFormData({ llm_prompt: value }),
        type: "textarea" as const,
        placeholder: "Optional prompt for AI extraction (leave empty for manual entry)",
        showCharCount: true,
      },
    ]
  },
}