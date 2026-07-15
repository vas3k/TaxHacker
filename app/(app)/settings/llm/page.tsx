import LLMSettingsForm from "@/components/settings/llm-settings-form"
import { SettingsPageHeader } from "@/components/settings/page-header"
import { getCurrentUser } from "@/lib/auth"
import config from "@/lib/config"
import { getFields } from "@/models/fields"
import { getSettings } from "@/models/settings"

export default async function LlmSettingsPage() {
  const user = await getCurrentUser()
  const settings = await getSettings(user.id)
  const fields = await getFields(user.id)

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="LLM settings"
        description="Configure AI providers, system prompt, and field ordering for document analysis."
      />
      <div className="w-full max-w-2xl">
        <LLMSettingsForm settings={settings} fields={fields} isSelfHosted={config.selfHosted.isEnabled} />
      </div>
    </div>
  )
}
