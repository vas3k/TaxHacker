import CategoryDefaultForm from "@/components/settings/category-default-form"
import { CrudTable } from "@/components/settings/crud"
import { SettingsPageHeader } from "@/components/settings/page-header"
import { Separator } from "@/components/ui/separator"
import { getCurrentUser } from "@/lib/auth"
import { randomHexColor } from "@/lib/utils"
import { getCategories } from "@/models/categories"
import { getSettings } from "@/models/settings"
import { Prisma } from "@/prisma/client"
import { addCategoryAction, deleteCategoryAction, editCategoryAction } from "@/app/(app)/settings/actions"

export default async function CategoriesSettingsPage() {
  const user = await getCurrentUser()
  const [categories, settings] = await Promise.all([getCategories(user.id), getSettings(user.id)])
  const categoriesWithActions = categories.map((category) => ({
    ...category,
    isEditable: true,
    isDeletable: true,
  }))

  return (
    <div className="space-y-8">
      <SettingsPageHeader
        title="Categories"
        description="Create categories that reflect your income and expenses. Define an LLM prompt so AI can assign the right category automatically."
      />
      <CategoryDefaultForm settings={settings} categories={categories} />
      <Separator />
      <CrudTable
        items={categoriesWithActions}
        columns={[
          { key: "name", label: "Name", editable: true },
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
