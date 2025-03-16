"use server"

import { createCategory, deleteCategory, updateCategory } from "@/data/categories"
import { createCurrency, deleteCurrency, updateCurrency } from "@/data/currencies"
import { createField, deleteField, updateField } from "@/data/fields"
import { createProject, deleteProject, updateProject } from "@/data/projects"
import { updateSettings } from "@/data/settings"
import { settingsFormSchema } from "@/forms/settings"
import { codeFromName } from "@/lib/utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function saveSettingsAction(prevState: any, formData: FormData) {
  const validatedForm = settingsFormSchema.safeParse(Object.fromEntries(formData))

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  for (const key in validatedForm.data) {
    await updateSettings(key, validatedForm.data[key as keyof typeof validatedForm.data])
  }

  revalidatePath("/settings")
  redirect("/settings")
  // return { success: true }
}

export async function addProjectAction(data: { name: string; llm_prompt?: string; color?: string }) {
  const project = await createProject({
    code: codeFromName(data.name),
    name: data.name,
    llm_prompt: data.llm_prompt || null,
    color: data.color || "#000000",
  })
  revalidatePath("/settings/projects")
  return project
}

export async function editProjectAction(code: string, data: { name: string; llm_prompt?: string; color?: string }) {
  const project = await updateProject(code, {
    name: data.name,
    llm_prompt: data.llm_prompt,
    color: data.color,
  })
  revalidatePath("/settings/projects")
  return project
}

export async function deleteProjectAction(code: string) {
  await deleteProject(code)
  revalidatePath("/settings/projects")
}

export async function addCurrencyAction(data: { code: string; name: string }) {
  const currency = await createCurrency({
    code: data.code,
    name: data.name,
  })
  revalidatePath("/settings/currencies")
  return currency
}

export async function editCurrencyAction(code: string, data: { name: string }) {
  const currency = await updateCurrency(code, { name: data.name })
  revalidatePath("/settings/currencies")
  return currency
}

export async function deleteCurrencyAction(code: string) {
  await deleteCurrency(code)
  revalidatePath("/settings/currencies")
}

export async function addCategoryAction(data: { name: string; llm_prompt?: string; color?: string }) {
  const category = await createCategory({
    code: codeFromName(data.name),
    name: data.name,
    llm_prompt: data.llm_prompt,
    color: data.color,
  })
  revalidatePath("/settings/categories")
  return category
}

export async function editCategoryAction(code: string, data: { name: string; llm_prompt?: string; color?: string }) {
  const category = await updateCategory(code, {
    name: data.name,
    llm_prompt: data.llm_prompt,
    color: data.color,
  })
  revalidatePath("/settings/categories")
  return category
}

export async function deleteCategoryAction(code: string) {
  await deleteCategory(code)
  revalidatePath("/settings/categories")
}

export async function addFieldAction(data: { name: string; type: string; llm_prompt?: string; isRequired?: boolean }) {
  const field = await createField({
    code: codeFromName(data.name),
    name: data.name,
    type: data.type,
    llm_prompt: data.llm_prompt,
    isRequired: data.isRequired,
    isExtra: true,
  })
  revalidatePath("/settings/fields")
  return field
}

export async function editFieldAction(
  code: string,
  data: { name: string; type: string; llm_prompt?: string; isRequired?: boolean }
) {
  const field = await updateField(code, {
    name: data.name,
    type: data.type,
    llm_prompt: data.llm_prompt,
    isRequired: data.isRequired,
  })
  revalidatePath("/settings/fields")
  return field
}

export async function deleteFieldAction(code: string) {
  await deleteField(code)
  revalidatePath("/settings/fields")
}
