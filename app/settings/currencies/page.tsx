import { addCurrencyAction, deleteCurrencyAction, editCurrencyAction } from "@/app/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { getCurrencies } from "@/models/currencies"

export default async function CurrenciesSettingsPage() {
  const currencies = await getCurrencies()
  const currenciesWithActions = currencies.map((currency) => ({
    ...currency,
    isEditable: true,
    isDeletable: true,
  }))

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-2">Currencies</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-prose">
        Custom currencies would not be automatically converted but you still can have them.
      </p>
      <CrudTable
        items={currenciesWithActions}
        columns={[
          { key: "code", label: "Code", editable: true },
          { key: "name", label: "Name", editable: true },
        ]}
        onDelete={async (code) => {
          "use server"
          return await deleteCurrencyAction(code)
        }}
        onAdd={async (data) => {
          "use server"
          return await addCurrencyAction(data as { code: string; name: string })
        }}
        onEdit={async (code, data) => {
          "use server"
          return await editCurrencyAction(code, data as { name: string })
        }}
      />
    </div>
  )
}
