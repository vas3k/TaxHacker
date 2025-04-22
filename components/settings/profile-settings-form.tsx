"use client"

import { saveProfileAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormInput } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatBytes, formatNumber } from "@/lib/utils"
import { User } from "@prisma/client"
import { CircleCheckBig } from "lucide-react"
import { useActionState } from "react"

export default function ProfileSettingsForm({ user }: { user: User }) {
  const [saveState, saveAction, pending] = useActionState(saveProfileAction, null)

  return (
    <div>
      <form action={saveAction} className="space-y-4">
        <FormInput title="Your Name" name="name" defaultValue={user.name || ""} />

        <div className="flex flex-row items-center gap-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
          {saveState?.success && (
            <p className="text-green-500 flex flex-row items-center gap-2">
              <CircleCheckBig />
              Saved!
            </p>
          )}
        </div>

        {saveState?.error && <FormError>{saveState.error}</FormError>}
      </form>
      <Card className="mt-4 p-4">
        <p>
          Storage Used: {formatBytes(user.storageUsed)} /{" "}
          {user.storageLimit > 0 ? formatBytes(user.storageLimit) : "Unlimited"}
        </p>
        <p>Tokens Balance: {formatNumber(user.tokenBalance)}</p>
      </Card>
    </div>
  )
}
