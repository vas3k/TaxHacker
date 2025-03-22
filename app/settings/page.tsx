import GlobalSettingsForm from "@/components/settings/global-settings-form"
import { getCategories } from "@/models/categories"
import { getCurrencies } from "@/models/currencies"
import { getSettings } from "@/models/settings"

export default async function SettingsPage() {
  const settings = await getSettings()
  const currencies = await getCurrencies()
  const categories = await getCategories()

  return (
    <>
      <div className="w-full max-w-2xl">
        <GlobalSettingsForm settings={settings} currencies={currencies} categories={categories} />
      </div>
    </>
  )
}
