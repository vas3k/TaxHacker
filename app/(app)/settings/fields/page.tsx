import { getCurrentUser } from "@/lib/auth"
import { getFields } from "@/models/fields"
import FieldsSettingsForm from "@/components/settings/fields-settings-form"

export default async function FieldsSettingsPage() {
  const user = await getCurrentUser()
  const fields = await getFields(user.id)
  const fieldsWithActions = fields.map((field) => ({
    ...field,
    isEditable: true,
    isDeletable: field.isExtra,
  }))

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-2">Custom Fields</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-prose">
        You can add new fields to your transactions. Standard fields can&apos;t be removed but you can tweak their
        prompts or hide them. If you don&apos;t want a field to be analyzed by AI but filled in by hand, leave the
        &quot;LLM prompt&quot; empty. Drag fields to reorder them.
      </p>
      <FieldsSettingsForm initialFields={fieldsWithActions} userId={user.id} />
    </div>
  )
}
