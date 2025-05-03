"use client"

import { fieldsToJsonSchema } from "@/ai/schema"
import { saveSettingsAction } from "@/app/(app)/settings/actions"
import { FormError } from "@/components/forms/error"
import { FormInput, FormTextarea } from "@/components/forms/simple"
import { Button } from "@/components/ui/button"
import { Card, CardTitle } from "@/components/ui/card"
import { Field } from "@/prisma/client"
import { CircleCheckBig, Edit } from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"

export default function LLMSettingsForm({
  settings,
  fields,
  showApiKey = true,
}: {
  settings: Record<string, string>
  fields: Field[]
  showApiKey?: boolean
}) {
  const [saveState, saveAction, pending] = useActionState(saveSettingsAction, null)

  return (
    <>
      <form action={saveAction} className="space-y-4">
        {showApiKey && (
          <>
            <FormInput title="OpenAI API Key" name="openai_api_key" defaultValue={settings.openai_api_key} />

            <small className="text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://platform.openai.com/settings/organization/api-keys"
                target="_blank"
                className="underline"
              >
                OpenAI Platform Console
              </a>
            </small>
          </>
        )}

        <FormTextarea
          title="Prompt for File Analysis Form"
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

        {saveState?.error && <FormError>{saveState.error}</FormError>}
      </form>

      <Card className="flex flex-col gap-4 p-4 bg-accent mt-20">
        <CardTitle className="flex flex-row justify-between items-center gap-2">
          <span className="text-md font-medium">
            Current JSON Schema for{" "}
            <a
              href="https://platform.openai.com/docs/guides/structured-outputs?api-mode=responses&lang=javascript"
              target="_blank"
              className="underline"
            >
              structured output
            </a>
          </span>
          <Link
            href="/settings/fields"
            className="text-xs underline inline-flex flex-row items-center gap-1 text-muted-foreground"
          >
            <Edit className="w-4 h-4" /> Edit Fields
          </Link>
        </CardTitle>
        <pre className="text-xs overflow-hidden text-ellipsis">
          {JSON.stringify(fieldsToJsonSchema(fields), null, 2)}
        </pre>
      </Card>
    </>
  )
}
