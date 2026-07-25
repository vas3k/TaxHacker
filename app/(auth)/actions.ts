"use server"

import { createUserDefaults, isDatabaseEmpty } from "@/models/defaults"
import { updateSettings } from "@/models/settings"
import { getOrCreateSelfHostedUser } from "@/models/users"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function selfHostedGetStartedAction(formData: FormData) {
  const user = await getOrCreateSelfHostedUser()

  if (await isDatabaseEmpty(user.id)) {
    await createUserDefaults(user.id)
  }

  const apiKeys = [
    "openai_api_key",
    "openai_model_name",
    "google_api_key",
    "google_model_name",
    "mistral_api_key",
    "mistral_model_name",
    "atlascloud_api_key",
    "atlascloud_model_name",
    "atlascloud_base_url",
    "openai_compatible_api_key",
    "openai_compatible_model_name",
    "openai_compatible_base_url",
  ]

  for (const key of apiKeys) {
    const value = formData.get(key)
    if (value) {
      await updateSettings(user.id, key, value as string)
    }
  }


  const defaultCurrency = formData.get("default_currency")
  if (defaultCurrency) {
    await updateSettings(user.id, "default_currency", defaultCurrency as string)
  }

  revalidatePath("/dashboard")
  redirect("/dashboard")
}
