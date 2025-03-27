import { addCategoryAction, deleteCategoryAction, editCategoryAction } from "@/app/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { randomHexColor } from "@/lib/utils"
import { getCategories } from "@/models/categories"
import { Prisma } from "@prisma/client"

export default async function CategoriesSettingsPage() {
  const categories = await getCategories()
  const categoriesWithActions = categories.map((category) => ({
    ...category,
    isEditable: true,
    isDeletable: true,
  }))

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-2">Categories</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-prose">
        Create your own categories that better reflect the type of income and expenses you have. Define an LLM Prompt so
        that AI can determine this category automatically.
      </p>

      <CrudTable
        items={categoriesWithActions}
        columns={[
          { key: "name", label: "Name", editable: true },
          { key: "llm_prompt", label: "LLM Prompt", editable: true },
          { key: "color", label: "Color", defaultValue: randomHexColor(), editable: true },
        ]}
        onDelete={async (code) => {
          "use server"
          return await deleteCategoryAction(code)
        }}
        onAdd={async (data) => {
          "use server"
          return await addCategoryAction(data as Prisma.CategoryCreateInput)
        }}
        onEdit={async (code, data) => {
          "use server"
          return await editCategoryAction(code, data as Prisma.CategoryUpdateInput)
        }}
      />
    </div>
  )
}
