import { PaperlessImport } from "@/components/import/paperless"
import { getCurrentUser } from "@/lib/auth"
import { getSettings } from "@/models/settings"

export default async function PaperlessImportPage() {
  const user = await getCurrentUser()
  const settings = await getSettings(user.id)

  const isPaperlessConfigured =
    settings.paperless_enabled === "true" && !!settings.paperless_url && !!settings.paperless_api_token

  return (
    <div className="flex flex-col gap-4 p-4">
      <PaperlessImport isPaperlessConfigured={isPaperlessConfigured} />
    </div>
  )
}
