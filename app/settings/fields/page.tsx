import { addFieldAction, deleteFieldAction, editFieldAction } from "@/app/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { getFields } from "@/models/fields"

export default async function FieldsSettingsPage() {
  const fields = await getFields()
  const fieldsWithActions = fields.map((field) => ({
    ...field,
    isEditable: true,
    isDeletable: field.isExtra,
  }))

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-6">Custom Fields</h1>
      <CrudTable
        items={fieldsWithActions}
        columns={[
          { key: "name", label: "Name", editable: true },
          { key: "type", label: "Type", defaultValue: "string", editable: true },
          { key: "llm_prompt", label: "LLM Prompt", editable: true },
        ]}
        onDelete={async (code) => {
          "use server"
          await deleteFieldAction(code)
        }}
        onAdd={async (data) => {
          "use server"
          await addFieldAction(
            data as {
              name: string
              type: string
              llm_prompt?: string
            }
          )
        }}
        onEdit={async (code, data) => {
          "use server"
          await editFieldAction(
            code,
            data as {
              name: string
              type: string
              llm_prompt?: string
            }
          )
        }}
      />
    </div>
  )
}
