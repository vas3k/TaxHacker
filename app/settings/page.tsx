import GlobalSettingsForm from "@/components/settings/global-settings-form"
import { getCategories } from "@/data/categories"
import { getCurrencies } from "@/data/currencies"
import { getSettings } from "@/data/settings"

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
