import LLMSettingsForm from "@/components/settings/llm-settings-form"
import { getFields } from "@/data/fields"
import { getSettings } from "@/data/settings"

export default async function LlmSettingsPage() {
  const settings = await getSettings()
  const fields = await getFields()

  return (
    <>
      <div className="w-full max-w-2xl">
        <LLMSettingsForm settings={settings} fields={fields} />
      </div>
    </>
  )
}
