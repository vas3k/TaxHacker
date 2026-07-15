import CurrencyDefaultsForm from "@/components/settings/currency-defaults-form"
import { CrudTable } from "@/components/settings/crud"
import { SettingsPageHeader } from "@/components/settings/page-header"
import { Separator } from "@/components/ui/separator"
import { getCurrentUser } from "@/lib/auth"
import { getCurrencies } from "@/models/currencies"
import { getSettings } from "@/models/settings"
import { addCurrencyAction, deleteCurrencyAction, editCurrencyAction } from "@/app/(app)/settings/actions"

export default async function CurrenciesSettingsPage() {
  const user = await getCurrentUser()
  const [currencies, settings] = await Promise.all([getCurrencies(user.id), getSettings(user.id)])
  const currenciesWithActions = currencies.map((currency) => ({
    ...currency,
    isEditable: true,
    isDeletable: true,
  }))

  return (
    <div className="space-y-8">
      <SettingsPageHeader
        title="Currencies"
        description="Set default currency and transaction type, and manage custom currencies for your account."
      />
      <CurrencyDefaultsForm settings={settings} currencies={currencies} />
      <Separator />
      <CrudTable
        items={currenciesWithActions}
        columns={[
          { key: "code", label: "Code", editable: true },
          { key: "name", label: "Name", editable: true },
        ]}
        onDelete={async (code) => {
          "use server"
          return await deleteCurrencyAction(user.id, code)
        }}
        onAdd={async (data) => {
          "use server"
          return await addCurrencyAction(user.id, data as { code: string; name: string })
        }}
        onEdit={async (code, data) => {
          "use server"
          return await editCurrencyAction(user.id, code, data as { name: string })
        }}
      />
    </div>
  )
}
