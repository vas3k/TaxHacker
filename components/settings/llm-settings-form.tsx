"use client"

import { fieldsToJsonSchema } from "@/ai/schema"
import { saveSettingsAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { Card, CardTitle } from "@/components/ui/card"
import { Field } from "@/prisma/client"
import { CircleCheckBig, Edit, GripVertical } from "lucide-react"
import Link from "next/link"
import { useState, useActionState } from "react"
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


function getInitialProviderOrder(settings: Record<string, string>) {
  let order: string[] = []
  if (!settings.llm_providers) {
    order = ['openai', 'google', 'mistral']
  } else {
    order = settings.llm_providers.split(",").map(p => p.trim())
  }
  // Remove duplicates and keep only valid providers
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

  // Controlled values for each provider
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

  function handleProviderValueChange(providerKey: string, field: "apiKey" | "model", value: string) {
    setProviderValues((prev) => ({
      ...prev,
      [providerKey]: {
        ...prev[providerKey],
        [field]: value,
      },
    }))
  }

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
};

function DndProviderBlocks({ providerOrder, setProviderOrder, providerValues, handleProviderValueChange }: DndProviderBlocksProps) {
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
};

function SortableProviderBlock({ id, idx, providerKey, value, handleValueChange }: SortableProviderBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const provider = PROVIDERS.find(p => p.key === providerKey)
  if (!provider) return null
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
        {/* Drag handle */}
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
        <input
          type="text"
          name={provider.modelName}
          value={value.model}
          onChange={e => handleValueChange(provider.key, "model", e.target.value)}
          className="flex-1 border rounded px-2 py-1"
          placeholder="Model name"
        />
      </div>
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
    </div>
  )
}
