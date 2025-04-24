import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { resetFieldsAndCategories, resetLLMSettings } from "./actions"

export default async function DangerSettingsPage() {
  const user = await getCurrentUser()

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-2 text-red-500">The Danger Zone</h1>
      <p className="text-sm text-red-400 mb-8 max-w-prose">
        The settings here will overwrite your existing fields, categories and prompts. Use them only if something is
        broken.
      </p>
      <div className="space-y-10">
        <div className="space-y-2">
          <h3 className="text-lg font-bold">LLM settings</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-prose">
            This will reset the system prompt and other LLM settings to their default values
          </p>
          <form
            action={async () => {
              "use server"
              await resetLLMSettings(user)
            }}
          >
            <Button variant="destructive" type="submit">
              Reset main LLM prompt
            </Button>
          </form>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold">Fields, currencies and categories</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-prose">
            This will reset all fields, currencies and categories to their default values
          </p>
          <form
            action={async () => {
              "use server"
              await resetFieldsAndCategories(user)
            }}
          >
            <Button variant="destructive" type="submit">
              Reset fields, currencies and categories
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
