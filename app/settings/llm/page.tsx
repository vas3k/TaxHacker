import LLMSettingsForm from "@/components/settings/llm-settings-form"
import { getFields } from "@/models/fields"
import { getSettings } from "@/models/settings"

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
