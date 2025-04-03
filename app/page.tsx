import LandingPage from "@/app/landing/landing"
import { getSession } from "@/lib/auth"
import { IS_SELF_HOSTED_MODE, SELF_HOSTED_REDIRECT_URL } from "@/lib/constants"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getSession()
  if (!session) {
    if (IS_SELF_HOSTED_MODE) {
      redirect(SELF_HOSTED_REDIRECT_URL)
    }
    return <LandingPage />
  }

  redirect("/dashboard")
}
