import BusinessSettingsForm from "@/components/settings/business-settings-form"
import { getCurrentUser } from "@/lib/auth"

export default async function BusinessSettingsPage() {
  const user = await getCurrentUser()

  return (
    <>
      <div className="w-full max-w-2xl">
        <BusinessSettingsForm user={user} />
      </div>
    </>
  )
}
