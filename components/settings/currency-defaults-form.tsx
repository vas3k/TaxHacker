"use client"

import { saveSettingsAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormSelectCurrency } from "@/components/forms/select-currency"
import { FormSelectType } from "@/components/forms/select-type"
import { Button } from "@/components/ui/button"
import { Currency } from "@/prisma/client"
import { CircleCheckBig } from "lucide-react"
import { useActionState } from "react"

export default function CurrencyDefaultsForm({
  settings,
  currencies,
}: {
  settings: Record<string, string>
  currencies: Currency[]
}) {
  const [saveState, saveAction, pending] = useActionState(saveSettingsAction, null)

  return (
    <form action={saveAction} className="space-y-4 max-w-2xl">
      <FormSelectCurrency
        title="Default Currency"
        name="default_currency"
        defaultValue={settings.default_currency}
        currencies={currencies}
      />
      <FormSelectType title="Default Transaction Type" name="default_type" defaultValue={settings.default_type} />
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
