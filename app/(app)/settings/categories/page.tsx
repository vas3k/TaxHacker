import { addCategoryAction, deleteCategoryAction, editCategoryAction } from "@/app/(app)/settings/actions"
import { CrudTable } from "@/components/settings/crud"
import { getCurrentUser } from "@/lib/auth"
import { randomHexColor } from "@/lib/utils"
import { getCategories } from "@/models/categories"
import { Prisma } from "@/prisma/client"

export default async function CategoriesSettingsPage() {
  const user = await getCurrentUser()
  const categories = await getCategories(user.id)

  // Get only parent categories (no parentCode) for the parent selector
  const parentCategoryOptions = ["", ...categories.filter((c) => !c.parentCode).map((c) => c.code)]

  // Format display name to show hierarchy
  const getDisplayName = (category: (typeof categories)[0]) => {
    if (category.parentCode) {
      const parent = categories.find((c) => c.code === category.parentCode)
      return parent ? `  └ ${category.name}` : category.name
    }
    return category.name
  }

  const categoriesWithActions = categories.map((category) => ({
    ...category,
    displayName: getDisplayName(category),
    isEditable: true,
    isDeletable: true,
  }))

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-2">Categories</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-prose">
        Create your own categories that better reflect the type of income and expenses you have. Define an LLM Prompt so
        that AI can determine this category automatically. You can create sub-categories by selecting a parent category.
      </p>

      <CrudTable
        items={categoriesWithActions}
        columns={[
          { key: "name", label: "Name", editable: true },
          {
            key: "parentCode",
            label: "Parent Category",
            type: "select",
            options: parentCategoryOptions,
            defaultValue: "",
            editable: true,
          },
          { key: "llm_prompt", label: "LLM Prompt", editable: true },
          { key: "color", label: "Color", type: "color", defaultValue: randomHexColor(), editable: true },
        ]}
        onDelete={async (code) => {
          "use server"
          return await deleteCategoryAction(user.id, code)
        }}
        onAdd={async (data) => {
          "use server"
          return await addCategoryAction(user.id, data as Prisma.CategoryCreateInput)
        }}
        onEdit={async (code, data) => {
          "use server"
          return await editCategoryAction(user.id, code, data as Prisma.CategoryUpdateInput)
        }}
      />
    </div>
  )
}
