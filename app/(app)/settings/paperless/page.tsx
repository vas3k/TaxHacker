import PaperlessSettingsForm from "@/components/settings/paperless-settings-form"
import { getCurrentUser } from "@/lib/auth"
import { getSettings } from "@/models/settings"

export default async function PaperlessSettingsPage() {
  const user = await getCurrentUser()
  const settings = await getSettings(user.id)

  return (
    <div className="w-full max-w-2xl">
      <PaperlessSettingsForm settings={settings} />
    </div>
  )
}
