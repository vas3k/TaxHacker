import { addFieldAction, deleteFieldAction, editFieldAction } from "@/app/(app)/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { SettingsPageHeader } from "@/components/settings/page-header"
import { getCurrentUser } from "@/lib/auth"
import { getFields } from "@/models/fields"
import { Prisma } from "@/prisma/client"

export default async function FieldsSettingsPage() {
  const user = await getCurrentUser()
  const fields = await getFields(user.id)
  const fieldsWithActions = fields.map((field) => ({
    ...field,
    isEditable: true,
    isDeletable: field.isExtra,
  }))

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="Fields"
        description="Add custom fields to transactions, tweak LLM prompts, or hide fields you don't need. Leave the LLM prompt empty for fields you want to fill in manually."
      />
      <CrudTable
        items={fieldsWithActions}
        columns={[
          { key: "name", label: "Name", editable: true },
          {
            key: "type",
            label: "Type",
            type: "select",
            options: ["string", "number", "boolean"],
            defaultValue: "string",
            editable: true,
          },
          { key: "llm_prompt", label: "LLM Prompt", editable: true },
          {
            key: "isVisibleInList",
            label: "Show in transactions table",
            type: "checkbox",
            defaultValue: false,
            editable: true,
          },
          {
            key: "isVisibleInAnalysis",
            label: "Show in analysis form",
            type: "checkbox",
            defaultValue: false,
            editable: true,
          },
          {
            key: "isRequired",
            label: "Is required",
            type: "checkbox",
            defaultValue: false,
            editable: true,
          },
        ]}
        onDelete={async (code) => {
          "use server"
          return await deleteFieldAction(user.id, code)
        }}
        onAdd={async (data) => {
          "use server"
          return await addFieldAction(user.id, data as Prisma.FieldCreateInput)
        }}
        onEdit={async (code, data) => {
          "use server"
          return await editFieldAction(user.id, code, data as Prisma.FieldUpdateInput)
        }}
      />
    </div>
  )
}
