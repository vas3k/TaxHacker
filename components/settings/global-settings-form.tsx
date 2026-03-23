"use client"

import { saveSettingsAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormInput } from "@/components/forms/simple"
import { FormSelectCategory } from "@/components/forms/select-category"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormSelectType } from "@/components/forms/select-type"
import { Button } from "@/components/ui/button"
import { Category, Currency } from "@/prisma/client"
import { CircleCheckBig } from "lucide-react"
import { useActionState } from "react"

export default function GlobalSettingsForm({
  settings,
  currencies,
  categories,
}: {
  settings: Record<string, string>
  currencies: Currency[]
  categories: Category[]
}) {
  const [saveState, saveAction, pending] = useActionState(saveSettingsAction, null)

  return (
    <form action={saveAction} className="space-y-4">
      <FormSelectCurrency
        title="Default Currency"
        name="default_currency"
        defaultValue={settings.default_currency}
        currencies={currencies}
      />

      <FormSelectType title="Default Transaction Type" name="default_type" defaultValue={settings.default_type} />

      <FormSelectCategory
        title="Default Transaction Category"
        name="default_category"
        defaultValue={settings.default_category}
        categories={categories}
      />

      <FormInput
        title="Tax Year Start Date (MM-DD)"
        name="tax_year_start"
        defaultValue={settings.tax_year_start || "01-01"}
        placeholder="01-01"
        pattern="[0-1][0-9]-[0-3][0-9]"
        maxLength={5}
      />
      <p className="text-xs text-muted-foreground -mt-3">
        Set when your tax year begins. Examples: 01-01 (January 1), 04-06 (UK: April 6), 07-01 (Australia: July 1)
      </p>

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
  )
}
