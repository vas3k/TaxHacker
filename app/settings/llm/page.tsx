import LLMSettingsForm from "@/components/settings/llm-settings-form"
import { getSettings } from "@/data/settings"

export default async function LlmSettingsPage() {
  const settings = await getSettings()

  return (
    <>
      <div className="w-full max-w-2xl">
        <LLMSettingsForm settings={settings} />
      </div>
    </>
  )
}
