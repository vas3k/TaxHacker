"use client"

import { saveSettingsAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormSelectCategory } from "@/components/forms/select-category"
import { Button } from "@/components/ui/button"
import { Category } from "@/prisma/client"
import { CircleCheckBig } from "lucide-react"
import { useActionState } from "react"

export default function CategoryDefaultForm({
  settings,
  categories,
}: {
  settings: Record<string, string>
  categories: Category[]
}) {
  const [saveState, saveAction, pending] = useActionState(saveSettingsAction, null)

  return (
    <form action={saveAction} className="space-y-4 max-w-2xl">
      <FormSelectCategory
        title="Default Transaction Category"
        name="default_category"
        defaultValue={settings.default_category}
        categories={categories}
      />
      <div className="flex flex-row items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
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
  )
}
