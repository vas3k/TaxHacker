"use server"

import { prisma } from "@/lib/db"
import { DEFAULT_CATEGORIES, DEFAULT_CURRENCIES, DEFAULT_FIELDS, DEFAULT_SETTINGS } from "@/models/defaults"
import { User } from "@prisma/client"
import { redirect } from "next/navigation"

export async function resetLLMSettings(user: User) {
  const llmSettings = DEFAULT_SETTINGS.filter((setting) => setting.code === "prompt_analyse_new_file")

  for (const setting of llmSettings) {
    await prisma.setting.upsert({
      where: { userId_code: { code: setting.code, userId: user.id } },
      update: { value: setting.value },
      create: { ...setting, userId: user.id },
    })
  }

  redirect("/settings/llm")
}

export async function resetFieldsAndCategories(user: User) {
  // Reset categories
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_code: { code: category.code, userId: user.id } },
      update: { name: category.name, color: category.color, llm_prompt: category.llm_prompt },
      create: { ...category, userId: user.id },
    })
  }

  // Reset currencies
  for (const currency of DEFAULT_CURRENCIES) {
    await prisma.currency.upsert({
      where: { userId_code: { code: currency.code, userId: user.id } },
      update: { name: currency.name },
      create: { ...currency, userId: user.id },
    })
  }

  // Reset fields
  for (const field of DEFAULT_FIELDS) {
    await prisma.field.upsert({
      where: { userId_code: { code: field.code, userId: user.id } },
      update: {
        name: field.name,
        type: field.type,
        llm_prompt: field.llm_prompt,
        isVisibleInList: field.isVisibleInList,
        isVisibleInAnalysis: field.isVisibleInAnalysis,
        isRequired: field.isRequired,
        isExtra: field.isExtra,
      },
      create: { ...field, userId: user.id },
    })
  }

  redirect("/settings/fields")
}
