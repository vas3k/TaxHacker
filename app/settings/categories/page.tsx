import { addCategoryAction, deleteCategoryAction, editCategoryAction } from "@/app/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { randomHexColor } from "@/lib/utils"
import { getCategories } from "@/models/categories"

export default async function CategoriesSettingsPage() {
  const categories = await getCategories()
  const categoriesWithActions = categories.map((category) => ({
    ...category,
    isEditable: true,
    isDeletable: true,
  }))

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-6">Categories</h1>
      <CrudTable
        items={categoriesWithActions}
        columns={[
          { key: "name", label: "Name", editable: true },
          { key: "llm_prompt", label: "LLM Prompt", editable: true },
          { key: "color", label: "Color", defaultValue: randomHexColor(), editable: true },
        ]}
        onDelete={async (code) => {
          "use server"
          await deleteCategoryAction(code)
        }}
        onAdd={async (data) => {
          "use server"
          await addCategoryAction(
            data as {
              code: string
              name: string
              llm_prompt?: string
              color: string
            }
          )
        }}
        onEdit={async (code, data) => {
          "use server"
          await editCategoryAction(
            code,
            data as {
              name: string
              llm_prompt?: string
              color?: string
            }
          )
        }}
      />
    </div>
  )
}
