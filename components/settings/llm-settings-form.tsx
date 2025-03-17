"use client"

import { saveSettingsAction } from "@/app/settings/actions"
import { FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { CircleCheckBig } from "lucide-react"
import { useActionState } from "react"

export default function LLMSettingsForm({ settings }: { settings: Record<string, string> }) {
  const [saveState, saveAction, pending] = useActionState(saveSettingsAction, null)

  return (
    <form action={saveAction} className="space-y-4">
      <FormInput title="OpenAI API Key" name="openai_api_key" defaultValue={settings.openai_api_key} />

      <small className="text-muted-foreground">
        Get your API key from{" "}
        <a href="https://platform.openai.com/settings/organization/api-keys" target="_blank" className="underline">
          OpenAI Platform Console
        </a>
      </small>

      <FormTextarea
        title="Prompt for Analyze Transaction"
        name="prompt_analyse_new_file"
        defaultValue={settings.prompt_analyse_new_file}
        className="h-96"
      />

      <div className="flex flex-row items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Settings"}
        </Button>
        {saveState?.success && (
          <p className="text-green-500 flex flex-row items-center gap-2">
            <CircleCheckBig />
            Saved!
          </p>
        )}
      </div>

      {saveState?.error && <p className="text-red-500">{saveState.error}</p>}
    </form>
  )
}
