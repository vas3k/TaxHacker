import ProfileSettingsForm from "@/components/settings/profile-settings-form copy"
import { getCurrentUser } from "@/lib/auth"

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser()

  return (
    <>
      <div className="w-full max-w-2xl">
        <ProfileSettingsForm user={user} />
      </div>
    </>
  )
}
