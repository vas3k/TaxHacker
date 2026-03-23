"use client"

import { fieldsToJsonSchema } from "@/ai/schema"
import { saveSettingsAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { Card, CardTitle } from "@/components/ui/card"
import { Field } from "@/prisma/client"
import { CircleCheckBig, Edit, GripVertical, RefreshCw, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useState, useActionState, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { PROVIDERS } from "@/lib/llm-providers";

interface ModelInfo {
  id: string
  name: string
  supportsVision?: boolean
}

function getInitialProviderOrder(settings: Record<string, string>) {
  let order: string[] = []
  if (!settings.llm_providers) {
    order = ['openai', 'google', 'mistral']
  } else {
    order = settings.llm_providers.split(",").map(p => p.trim())
  }
  return order.filter((key, idx) => PROVIDERS.some(p => p.key === key) && order.indexOf(key) === idx)
}

export default function LLMSettingsForm({
  settings,
  fields,
}: {
  settings: Record<string, string>
  fields: Field[]
  showApiKey?: boolean
}) {
  const [saveState, saveAction, pending] = useActionState(saveSettingsAction, null)
  const [providerOrder, setProviderOrder] = useState<string[]>(getInitialProviderOrder(settings))

  const [providerValues, setProviderValues] = useState(() => {
    const values: Record<string, { apiKey: string; model: string }> = {}
    PROVIDERS.forEach((provider) => {
      values[provider.key] = {
        apiKey: settings[provider.apiKeyName],
        model: settings[provider.modelName] || provider.defaultModelName,
      }
    })
    return values
  })

  const [availableModels, setAvailableModels] = useState<Record<string, ModelInfo[]>>({})
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({})
  const [modelErrors, setModelErrors] = useState<Record<string, string>>({})

  function handleProviderValueChange(providerKey: string, field: "apiKey" | "model", value: string) {
    setProviderValues((prev) => ({
      ...prev,
      [providerKey]: {
        ...prev[providerKey],
        [field]: value,
      },
    }))
  }

  const fetchModelsForProvider = useCallback(async (providerKey: string, apiKey: string) => {
    if (!apiKey || apiKey.length < 10) return

    setLoadingModels((prev) => ({ ...prev, [providerKey]: true }))
    setModelErrors((prev) => ({ ...prev, [providerKey]: "" }))

    try {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerKey, apiKey }),
      })

      const data = await response.json()

      if (data.error) {
        setModelErrors((prev) => ({ ...prev, [providerKey]: data.error }))
      } else if (data.models && data.models.length > 0) {
        setAvailableModels((prev) => ({ ...prev, [providerKey]: data.models }))
      }
    } catch {
      setModelErrors((prev) => ({
        ...prev,
        [providerKey]: "Failed to fetch models",
      }))
    } finally {
      setLoadingModels((prev) => ({ ...prev, [providerKey]: false }))
    }
  }, [])

  return (
    <>
      <form action={saveAction} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">LLM providers</label>
          <DndProviderBlocks
            providerOrder={providerOrder}
            setProviderOrder={setProviderOrder}
            providerValues={providerValues}
            handleProviderValueChange={handleProviderValueChange}
            availableModels={availableModels}
            loadingModels={loadingModels}
            modelErrors={modelErrors}
            fetchModelsForProvider={fetchModelsForProvider}
          />
          <small className="text-muted-foreground">
            Drag provider blocks to reorder. First is highest priority.
          </small>
        </div>
        <input type="hidden" name="llm_providers" value={providerOrder.join(",")} />

        <FormTextarea
          title="Prompt for File Analysis Form"
          name="prompt_analyse_new_file"
          defaultValue={settings.prompt_analyse_new_file}
          className="h-96"
        />

        <div className="flex flex-row items-center gap-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Settings"}
          </Button>
          {saveState?.success && (
            <p className="text-green-500 flex flex-row items-center gap-2">
              <CircleCheckBig />
              Saved!
            </p>
          )}
        </div>

        {saveState?.error && <FormError>{saveState.error}</FormError>}
      </form>

      <Card className="flex flex-col gap-4 p-4 bg-accent mt-20">
        <CardTitle className="flex flex-row justify-between items-center gap-2">
          <span className="text-md font-medium">
            Current JSON Schema for{" "}
            <a
              href="https://platform.openai.com/docs/guides/structured-outputs?api-mode=responses&lang=javascript"
              target="_blank"
              className="underline"
            >
              structured output
            </a>
          </span>
          <Link
            href="/settings/fields"
            className="text-xs underline inline-flex flex-row items-center gap-1 text-muted-foreground"
          >
            <Edit className="w-4 h-4" /> Edit Fields
          </Link>
        </CardTitle>
        <pre className="text-xs overflow-hidden text-ellipsis">
          {JSON.stringify(fieldsToJsonSchema(fields), null, 2)}
        </pre>
      </Card>
    </>
  )
}

type DndProviderBlocksProps = {
  providerOrder: string[];
  setProviderOrder: React.Dispatch<React.SetStateAction<string[]>>;
  providerValues: Record<string, { apiKey: string; model: string }>;
  handleProviderValueChange: (providerKey: string, field: "apiKey" | "model", value: string) => void;
  availableModels: Record<string, ModelInfo[]>;
  loadingModels: Record<string, boolean>;
  modelErrors: Record<string, string>;
  fetchModelsForProvider: (providerKey: string, apiKey: string) => Promise<void>;
};

function DndProviderBlocks({
  providerOrder,
  setProviderOrder,
  providerValues,
  handleProviderValueChange,
  availableModels,
  loadingModels,
  modelErrors,
  fetchModelsForProvider,
}: DndProviderBlocksProps) {
  const sensors = useSensors(useSensor(PointerSensor))
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = providerOrder.indexOf(active.id as string)
    const newIndex = providerOrder.indexOf(over.id as string)
    setProviderOrder(arrayMove(providerOrder, oldIndex, newIndex))
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={providerOrder} strategy={verticalListSortingStrategy}>
        {providerOrder.map((providerKey, idx) => (
          <SortableProviderBlock
            key={providerKey}
            id={providerKey}
            idx={idx}
            providerKey={providerKey}
            value={providerValues[providerKey]}
            handleValueChange={handleProviderValueChange}
            availableModels={availableModels[providerKey] || []}
            isLoadingModels={loadingModels[providerKey] || false}
            modelError={modelErrors[providerKey] || ""}
            fetchModels={fetchModelsForProvider}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}

type SortableProviderBlockProps = {
  id: string;
  idx: number;
  providerKey: string;
  value: { apiKey: string; model: string };
  handleValueChange: (providerKey: string, field: "apiKey" | "model", value: string) => void;
  availableModels: ModelInfo[];
  isLoadingModels: boolean;
  modelError: string;
  fetchModels: (providerKey: string, apiKey: string) => Promise<void>;
};

function SortableProviderBlock({
  id,
  idx,
  providerKey,
  value,
  handleValueChange,
  availableModels,
  isLoadingModels,
  modelError,
  fetchModels,
}: SortableProviderBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const [showDropdown, setShowDropdown] = useState(false)

  const provider = PROVIDERS.find(p => p.key === providerKey)
  if (!provider) return null

  const handleFetchModels = () => {
    if (value.apiKey) {
      fetchModels(providerKey, value.apiKey)
    }
  }

  const handleSelectModel = (modelId: string) => {
    handleValueChange(providerKey, "model", modelId)
    setShowDropdown(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translateY(${transform.y}px)` : undefined,
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className={`bg-muted rounded-lg p-4 shadow flex flex-col gap-2 mb-2`}
    >
      <div className="flex flex-row items-center gap-2 mb-2">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 rounded hover:bg-accent transition inline-flex items-center"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </span>
        <span className="font-semibold">{provider.label}</span>
      </div>
      <div className="flex flex-row gap-4 items-center">
        <input
          type="text"
          name={provider.apiKeyName}
          value={value.apiKey}
          onChange={e => handleValueChange(provider.key, "apiKey", e.target.value)}
          className="flex-1 border rounded px-2 py-1"
          placeholder="API key"
        />
        <div className="flex-1 relative">
          <div className="flex gap-1">
            <input
              type="text"
              name={provider.modelName}
              value={value.model}
              onChange={e => handleValueChange(provider.key, "model", e.target.value)}
              className="flex-1 border rounded px-2 py-1"
              placeholder="Model name"
            />
            {value.apiKey && (
              <>
                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={isLoadingModels}
                  className="p-1 border rounded hover:bg-accent transition disabled:opacity-50"
                  title="Fetch available models from API"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingModels ? "animate-spin" : ""}`} />
                </button>
                {availableModels.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-1 border rounded hover:bg-accent transition"
                    title="Select from available models"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
          {showDropdown && availableModels.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-background border rounded shadow-lg max-h-60 overflow-auto">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleSelectModel(model.id)}
                  className={`w-full px-3 py-2 text-left hover:bg-accent text-sm ${
                    value.model === model.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{model.name}</span>
                    {model.supportsVision && (
                      <span className="text-xs text-muted-foreground">👁 vision</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {provider.apiDoc && (
          <small className="text-muted-foreground">
            Get your API key from{" "}
            <a
              href={provider.apiDoc}
              target="_blank"
              className="underline"
            >
              {provider.apiDocLabel}
            </a>
          </small>
        )}
        {modelError && (
          <small className="text-red-500">{modelError}</small>
        )}
        {availableModels.length > 0 && (
          <small className="text-green-600">
            ✓ {availableModels.length} models available - click ↓ to select
          </small>
        )}
        {!availableModels.length && value.apiKey && !isLoadingModels && !modelError && (
          <small className="text-muted-foreground">
            Click refresh ↻ to load available models from the API
          </small>
        )}
        {!value.apiKey && provider.suggestedModels && (
          <small className="text-muted-foreground">
            Suggested models: {provider.suggestedModels.join(", ")}
          </small>
        )}
      </div>
    </div>
  )
}
