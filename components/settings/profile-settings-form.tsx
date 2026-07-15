"use client"

import { saveProfileAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormAvatar, FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { User } from "@/prisma/client"
import { CircleCheckBig } from "lucide-react"
import { useActionState } from "react"
import { SubscriptionPlan } from "./subscription-plan"

export default function ProfileSettingsForm({ user }: { user: User }) {
  const [saveState, saveAction, pending] = useActionState(saveProfileAction, null)

  return (
    <div className="space-y-8">
      <SubscriptionPlan user={user} />

      <form action={saveAction} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your TaxHacker Profile</h3>
          <FormAvatar
            title="Avatar"
            name="avatar"
            className="w-24 h-24"
            defaultValue={user.avatar ? user.avatar + "?" + user.id : ""}
          />
          <FormInput title="Account Name" name="name" defaultValue={user.name || ""} />
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
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Your Business Details</h3>
            <p className="text-sm text-muted-foreground">
              Used on invoices and as defaults across the app.
            </p>
          </div>
          <FormInput
            title="Business Name"
            name="businessName"
            placeholder="Acme Inc."
            defaultValue={user.businessName ?? ""}
          />
          <FormTextarea
            title="Business Address"
            name="businessAddress"
            placeholder="Street, City, State, Zip Code, Country, Tax ID"
            defaultValue={user.businessAddress ?? ""}
          />
          <FormTextarea
            title="Bank Details"
            name="businessBankDetails"
            placeholder="Bank Name, Account Number, BIC, IBAN, details of payment, etc."
            defaultValue={user.businessBankDetails ?? ""}
          />
          <FormAvatar
            title="Business Logo"
            name="businessLogo"
            className="w-52 h-52"
            defaultValue={user.businessLogo ?? ""}
          />
        </div>

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
    </div>
  )
}
