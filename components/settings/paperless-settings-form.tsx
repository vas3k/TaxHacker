"use client"

import { saveSettingsAction } from "@/app/(app)/settings/actions"
import { testPaperlessConnectionAction } from "@/app/(app)/settings/paperless/actions"
import { FormError } from "@/components/forms/error"
import { FormInput } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CircleCheckBig, Loader2, Plug } from "lucide-react"
import Link from "next/link"
import { useActionState, useState } from "react"

export default function PaperlessSettingsForm({ settings }: { settings: Record<string, string> }) {
  const [saveState, saveAction, isSaving] = useActionState(saveSettingsAction, null)
  const [testState, testAction, isTesting] = useActionState(testPaperlessConnectionAction, null)
  const [enabled, setEnabled] = useState(settings.paperless_enabled === "true")

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Paperless-ngx Integration</h3>
        <p className="text-sm text-muted-foreground">
          Connect to your{" "}
          <a href="https://docs.paperless-ngx.com/" target="_blank" className="underline">
            Paperless-ngx
          </a>{" "}
          instance to import and export documents.
        </p>
      </div>

      <form action={saveAction} className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="paperless_enabled"
            checked={enabled}
            onCheckedChange={(checked) => setEnabled(checked === true)}
          />
          <input type="hidden" name="paperless_enabled" value={enabled ? "true" : "false"} />
          <label htmlFor="paperless_enabled" className="text-sm font-medium cursor-pointer">
            Enable Paperless-ngx integration
          </label>
        </div>

        <FormInput
          title="Paperless-ngx URL"
          name="paperless_url"
          type="url"
          placeholder="https://paperless.example.com"
          defaultValue={settings.paperless_url}
        />

        <FormInput
          title="API Token"
          name="paperless_api_token"
          type="password"
          placeholder="Your Paperless-ngx API token"
          defaultValue={settings.paperless_api_token}
        />

        <small className="text-muted-foreground block">
          Generate a token from your Paperless-ngx instance under My Profile &rarr; Auth Tokens.
        </small>

        <FormInput
          title="Default Tags (optional)"
          name="paperless_default_tags"
          placeholder="tag1, tag2"
          defaultValue={settings.paperless_default_tags}
        />

        <small className="text-muted-foreground block">
          Comma-separated tag names to apply when exporting documents to Paperless-ngx.
        </small>

        <div className="flex flex-row items-center gap-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
          {saveState?.success && (
            <p className="text-green-500 flex flex-row items-center gap-2">
              <CircleCheckBig className="h-4 w-4" />
              Saved!
            </p>
          )}
        </div>

        {saveState?.error && <FormError>{saveState.error}</FormError>}
      </form>

      <div className="border-t pt-4">
        <form action={testAction} className="flex flex-row items-center gap-4">
          <input type="hidden" name="paperless_url" value={settings.paperless_url || ""} />
          <input type="hidden" name="paperless_api_token" value={settings.paperless_api_token || ""} />
          <Button type="submit" variant="outline" disabled={isTesting}>
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plug className="h-4 w-4" />
            )}
            Test Connection
          </Button>
          {testState?.success && (
            <p className="text-green-500 flex flex-row items-center gap-2 text-sm">
              <CircleCheckBig className="h-4 w-4" />
              Connected! Found {testState.data?.documentCount} documents.
            </p>
          )}
          {testState?.error && (
            <p className="text-red-500 text-sm">{testState.error}</p>
          )}
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Save your settings first, then test the connection.
        </p>
      </div>

      {enabled && settings.paperless_url && settings.paperless_api_token && (
        <div className="border-t pt-4 space-y-2">
          <p className="text-sm font-medium">Quick Links</p>
          <div className="flex flex-row gap-4">
            <Link href="/import/paperless" className="text-sm underline text-muted-foreground">
              Import from Paperless-ngx
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
