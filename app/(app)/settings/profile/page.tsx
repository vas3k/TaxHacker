import ProfileSettingsForm from "@/components/settings/profile-settings-form"
import { SettingsPageHeader } from "@/components/settings/page-header"
import { getCurrentUser } from "@/lib/auth"

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser()

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="Profile & Plan"
        description="Manage your account, subscription, and business details used on invoices."
      />
      <div className="w-full max-w-2xl">
        <ProfileSettingsForm user={user} />
      </div>
    </div>
  )
}
