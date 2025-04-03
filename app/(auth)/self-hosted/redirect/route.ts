import config from "@/lib/config"
import { createUserDefaults, isDatabaseEmpty } from "@/models/defaults"
import { getSelfHostedUser } from "@/models/users"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function GET(request: Request) {
  if (!config.selfHosted.isEnabled) {
    redirect(config.auth.loginUrl)
  }

  const user = await getSelfHostedUser()
  if (!user) {
    redirect(config.selfHosted.welcomeUrl)
  }

  if (await isDatabaseEmpty(user.id)) {
    await createUserDefaults(user.id)
  }

  revalidatePath("/dashboard")
  redirect("/dashboard")
}
