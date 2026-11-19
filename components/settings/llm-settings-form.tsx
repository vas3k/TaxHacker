"use client"

import { fieldsToJsonSchema } from "@/ai/schema"
import { saveSettingsAction, testLLMProviderAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormSelect, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { Card, CardTitle } from "@/components/ui/card"
import {
  createDefaultInstance,
  getProviderMeta,
  PROVIDER_KINDS,
  ProviderInstance,
  ProviderKind,
  resolveInstances,
  serializeInstances,
} from "@/lib/llm-providers"
import { DEFAULT_PREVIEW_FORMAT } from "@/lib/previews/format"
import { Field } from "@/prisma/client"
import type { DragEndEvent } from "@dnd-kit/core"
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CircleCheckBig, Edit, GripVertical, Loader2, Plug, Plus, X } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"

type EditableField = "apiKey" | "model" | "baseUrl" | "maxConcurrency"

export default function LLMSettingsForm({
  settings,
  fields,
  isSelfHosted,
}: {
  settings: Record<string, string>
  fields: Field[]
  isSelfHosted: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [saveState, setSaveState] = useState<{ success: boolean; error?: string | null } | null>(null)
  const [instances, setInstances] = useState<ProviderInstance[]>(() =>
    resolveInstances(settings)
  )

  function updateField(id: string, field: EditableField, value: string) {
    setInstances((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        if (field === "apiKey") return { ...i, apiKey: value }
        if (field === "model") return { ...i, model: value }
        if (field === "baseUrl") return { ...i, baseUrl: value }
        const n = parseInt(value, 10)
        return { ...i, maxConcurrency: Number.isFinite(n) && n >= 1 ? n : 1 }
      })
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setInstances((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id)
      const newIndex = prev.findIndex((i) => i.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  function handleAdd(kind: ProviderKind) {
    setInstances((prev) => [...prev, createDefaultInstance(kind)])
  }

  function handleRemove(id: string) {
    setInstances((prev) => prev.filter((i) => i.id !== id))
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveSettingsAction(saveState, formData)
      setSaveState(result)
    })
  }

  return (
    <>
      <form action={handleSubmit} className="space-y-4">
        {isSelfHosted && (
          <div className="space-y-3">
            <label className="text-sm font-medium">LLM providers</label>
            <ProviderCardList
              instances={instances}
              onDragEnd={handleDragEnd}
              onUpdateField={updateField}
              onRemove={handleRemove}
            />
            <AddProviderControl onAdd={handleAdd} />
            <small className="text-muted-foreground">
              Drag provider blocks to reorder. First is highest priority.
            </small>
          </div>
        )}

        {isSelfHosted && (
          <input
            type="hidden"
            name="llm_provider_instances"
            value={serializeInstances(instances)}
          />
        )}

        {isSelfHosted && (
          <div className="space-y-1">
            <FormSelect
              title="Image format for AI analysis"
              name="llm_attachment_format"
              defaultValue={settings.llm_attachment_format || DEFAULT_PREVIEW_FORMAT}
              items={[
                { code: "webp", name: "WebP (smaller, less tokens)" },
                { code: "jpeg", name: "JPEG (most compatible)" },
                { code: "png", name: "PNG (best quality, expensive)" },
              ]}
            />
            <small className="text-muted-foreground">
              WebP is smaller and works with cloud providers. Use PNG or JPEG for
              local models like Ollama that cannot decode WebP.
            </small>
          </div>
        )}

        <FormTextarea
          title="Prompt for File Analysis Form"
          name="prompt_analyse_new_file"
          defaultValue={settings.prompt_analyse_new_file}
          className="h-96"
        />

        <div className="flex flex-row items-center gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Settings"}
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

function AddProviderControl({ onAdd }: { onAdd: (kind: ProviderKind) => void }) {
  const [selectedKind, setSelectedKind] = useState<ProviderKind>(PROVIDER_KINDS[0])
  return (
    <div className="flex flex-row items-center gap-2">
      <select
        value={selectedKind}
        onChange={(e) => setSelectedKind(e.target.value as ProviderKind)}
        className="border rounded px-2 py-1 text-sm"
      >
        {PROVIDER_KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {getProviderMeta(kind).label}
          </option>
        ))}
      </select>
      <Button type="button" variant="outline" size="sm" onClick={() => onAdd(selectedKind)}>
        <Plus className="w-4 h-4 mr-1" /> Add provider
      </Button>
    </div>
  )
}

type ProviderCardListProps = {
  instances: ProviderInstance[]
  onDragEnd: (event: DragEndEvent) => void
  onUpdateField: (id: string, field: EditableField, value: string) => void
  onRemove: (id: string) => void
}

function ProviderCardList({
  instances,
  onDragEnd,
  onUpdateField,
  onRemove,
}: ProviderCardListProps) {
  const sensors = useSensors(useSensor(PointerSensor))
  const ids = instances.map((i) => i.id)
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="my-6 flex flex-col gap-4">
          {instances.map((instance, idx) => (
            <ProviderCard
              key={instance.id}
              instance={instance}
              idx={idx}
              onUpdateField={onUpdateField}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

type TestState = {
  status: "idle" | "testing" | "success" | "error"
  message?: string
}

type ProviderCardProps = {
  instance: ProviderInstance
  idx: number
  onUpdateField: (id: string, field: EditableField, value: string) => void
  onRemove: (id: string) => void
}

function ProviderCard({
  instance,
  idx,
  onUpdateField,
  onRemove,
}: ProviderCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: instance.id })
  const [testState, setTestState] = useState<TestState>({ status: "idle" })

  const provider = getProviderMeta(instance.kind)

  async function handleTest() {
    setTestState({ status: "testing" })
    try {
      const result = await testLLMProviderAction(
        instance.kind,
        instance.apiKey,
        instance.model,
        instance.baseUrl || undefined
      )
      setTestState({
        status: result.success ? "success" : "error",
        message: result.message,
      })
    } catch (error) {
      setTestState({
        status: "error",
        message: error instanceof Error ? error.message : "Test failed unexpectedly",
      })
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={{
        transform: transform ? `translateY(${transform.y}px)` : undefined,
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="flex flex-col gap-2 p-4"
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
        <span className="text-xs text-muted-foreground">#{idx + 1}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={testState.status === "testing" || !instance.model}
          className="ml-auto h-7 text-xs"
        >
          {testState.status === "testing" ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" /> Testing...
            </>
          ) : (
            <>
              <Plug className="w-3 h-3" /> Test
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(instance.id)}
          className="h-7 w-7 p-0"
          aria-label="Remove this instance"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-row gap-4 items-center">
        <input
          type="text"
          value={instance.apiKey}
          onChange={(e) => onUpdateField(instance.id, "apiKey", e.target.value)}
          className="flex-1 border rounded px-2 py-1"
          placeholder={provider.baseUrlName ? "API key (optional)" : "API key"}
        />
        <input
          type="text"
          value={instance.model}
          onChange={(e) => onUpdateField(instance.id, "model", e.target.value)}
          className="flex-1 border rounded px-2 py-1"
          placeholder="Model name"
        />
      </div>
      {provider.baseUrlName && (
        <input
          type="text"
          value={instance.baseUrl}
          onChange={(e) => onUpdateField(instance.id, "baseUrl", e.target.value)}
          className="w-full border rounded px-2 py-1"
          placeholder="Base URL (e.g. http://localhost:11434/v1)"
        />
      )}
      <div className="flex flex-row items-center gap-2">
        <input
          type="number"
          min={1}
          step={1}
          value={instance.maxConcurrency}
          onChange={(e) => onUpdateField(instance.id, "maxConcurrency", e.target.value)}
          className="w-20 border rounded px-2 py-1"
        />
        <span className="text-xs text-muted-foreground">
          Max concurrency for &quot;Analyze all&quot; (1 = safe; raise only if your
          plan allows it)
        </span>
      </div>
      {testState.status === "success" && (
        <p className="text-sm text-green-600 flex flex-row items-center gap-1">
          <CircleCheckBig className="w-4 h-4 flex-shrink-0" /> {testState.message}
        </p>
      )}
      {testState.status === "error" && (
        <p className="text-sm text-red-500 flex flex-row items-start gap-1">
          <X className="w-4 h-4 flex-shrink-0 mt-0.5" /> {testState.message}
        </p>
      )}
      {provider.apiDoc && (
        <small className="text-muted-foreground">
          Get your API key from{" "}
          <a href={provider.apiDoc} target="_blank" className="underline">
            {provider.apiDocLabel}
          </a>
        </small>
      )}
    </Card>
  )
}
