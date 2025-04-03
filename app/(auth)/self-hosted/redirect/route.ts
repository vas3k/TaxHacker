import { AUTH_LOGIN_URL, IS_SELF_HOSTED_MODE, SELF_HOSTED_WELCOME_URL } from "@/lib/constants"
import { createUserDefaults, isDatabaseEmpty } from "@/models/defaults"
import { getSelfHostedUser } from "@/models/users"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function GET(request: Request) {
  if (!IS_SELF_HOSTED_MODE) {
    redirect(AUTH_LOGIN_URL)
  }

  const user = await getSelfHostedUser()
  if (!user) {
    redirect(SELF_HOSTED_WELCOME_URL)
  }

  if (await isDatabaseEmpty(user.id)) {
    await createUserDefaults(user.id)
  }

  revalidatePath("/dashboard")
  redirect("/dashboard")
}
