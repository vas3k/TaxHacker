import { addCurrencyAction, deleteCurrencyAction, editCurrencyAction } from "@/app/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { getCurrencies } from "@/data/currencies"

export default async function CurrenciesSettingsPage() {
  const currencies = await getCurrencies()
  const currenciesWithActions = currencies.map((currency) => ({
    ...currency,
    isEditable: true,
    isDeletable: true,
  }))

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-6">Currencies</h1>
      <CrudTable
        items={currenciesWithActions}
        columns={[
          { key: "code", label: "Code", editable: true },
          { key: "name", label: "Name", editable: true },
        ]}
        onDelete={async (code) => {
          "use server"
          await deleteCurrencyAction(code)
        }}
        onAdd={async (data) => {
          "use server"
          await addCurrencyAction(data as { code: string; name: string })
        }}
        onEdit={async (code, data) => {
          "use server"
          await editCurrencyAction(code, data as { name: string })
        }}
      />
    </div>
  )
}
