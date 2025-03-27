"use server"

import {
  categoryFormSchema,
  currencyFormSchema,
  fieldFormSchema,
  projectFormSchema,
  settingsFormSchema,
} from "@/forms/settings"
import { codeFromName, randomHexColor } from "@/lib/utils"
import { createCategory, deleteCategory, updateCategory } from "@/models/categories"
import { createCurrency, deleteCurrency, updateCurrency } from "@/models/currencies"
import { createField, deleteField, updateField } from "@/models/fields"
import { createProject, deleteProject, updateProject } from "@/models/projects"
import { updateSettings } from "@/models/settings"
import { Prisma } from "@prisma/client"
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

export async function addProjectAction(data: Prisma.ProjectCreateInput) {
  const validatedForm = projectFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const project = await createProject({
    code: codeFromName(validatedForm.data.name),
    name: validatedForm.data.name,
    llm_prompt: validatedForm.data.llm_prompt || null,
    color: validatedForm.data.color || randomHexColor(),
  })
  revalidatePath("/settings/projects")

  return { success: true, project }
}

export async function editProjectAction(code: string, data: Prisma.ProjectUpdateInput) {
  const validatedForm = projectFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const project = await updateProject(code, {
    name: validatedForm.data.name,
    llm_prompt: validatedForm.data.llm_prompt,
    color: validatedForm.data.color || "",
  })
  revalidatePath("/settings/projects")

  return { success: true, project }
}

export async function deleteProjectAction(code: string) {
  try {
    await deleteProject(code)
  } catch (error) {
    return { success: false, error: "Failed to delete project" + error }
  }
  revalidatePath("/settings/projects")
  return { success: true }
}

export async function addCurrencyAction(data: Prisma.CurrencyCreateInput) {
  const validatedForm = currencyFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const currency = await createCurrency({
    code: validatedForm.data.code,
    name: validatedForm.data.name,
  })
  revalidatePath("/settings/currencies")

  return { success: true, currency }
}

export async function editCurrencyAction(code: string, data: Prisma.CurrencyUpdateInput) {
  const validatedForm = currencyFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const currency = await updateCurrency(code, { name: validatedForm.data.name })
  revalidatePath("/settings/currencies")
  return { success: true, currency }
}

export async function deleteCurrencyAction(code: string) {
  try {
    await deleteCurrency(code)
  } catch (error) {
    return { success: false, error: "Failed to delete currency" + error }
  }
  revalidatePath("/settings/currencies")
  return { success: true }
}

export async function addCategoryAction(data: Prisma.CategoryCreateInput) {
  const validatedForm = categoryFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const category = await createCategory({
    code: codeFromName(validatedForm.data.name),
    name: validatedForm.data.name,
    llm_prompt: validatedForm.data.llm_prompt,
    color: validatedForm.data.color || "",
  })
  revalidatePath("/settings/categories")

  return { success: true, category }
}

export async function editCategoryAction(code: string, data: Prisma.CategoryUpdateInput) {
  const validatedForm = categoryFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const category = await updateCategory(code, {
    name: validatedForm.data.name,
    llm_prompt: validatedForm.data.llm_prompt,
    color: validatedForm.data.color || "",
  })
  revalidatePath("/settings/categories")

  return { success: true, category }
}

export async function deleteCategoryAction(code: string) {
  try {
    await deleteCategory(code)
  } catch (error) {
    return { success: false, error: "Failed to delete category" + error }
  }
  revalidatePath("/settings/categories")
  return { success: true }
}

export async function addFieldAction(data: Prisma.FieldCreateInput) {
  const validatedForm = fieldFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const field = await createField({
    code: codeFromName(validatedForm.data.name),
    name: validatedForm.data.name,
    type: validatedForm.data.type,
    llm_prompt: validatedForm.data.llm_prompt,
    isVisibleInList: validatedForm.data.isVisibleInList,
    isVisibleInAnalysis: validatedForm.data.isVisibleInAnalysis,
    isExtra: true,
  })
  revalidatePath("/settings/fields")

  return { success: true, field }
}

export async function editFieldAction(code: string, data: Prisma.FieldUpdateInput) {
  const validatedForm = fieldFormSchema.safeParse(data)

  if (!validatedForm.success) {
    return { success: false, error: validatedForm.error.message }
  }

  const field = await updateField(code, {
    name: validatedForm.data.name,
    type: validatedForm.data.type,
    llm_prompt: validatedForm.data.llm_prompt,
    isVisibleInList: validatedForm.data.isVisibleInList,
    isVisibleInAnalysis: validatedForm.data.isVisibleInAnalysis,
  })
  revalidatePath("/settings/fields")

  return { success: true, field }
}

export async function deleteFieldAction(code: string) {
  try {
    await deleteField(code)
  } catch (error) {
    return { success: false, error: "Failed to delete field" + error }
  }
  revalidatePath("/settings/fields")
  return { success: true }
}
