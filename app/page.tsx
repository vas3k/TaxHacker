import LandingPage from "@/app/landing/landing"
import { getSession } from "@/lib/auth"
import config from "@/lib/config"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getSession()
  if (!session) {
    if (config.selfHosted.isEnabled) {
      redirect(config.selfHosted.redirectUrl)
    }
    return <LandingPage />
  }

  redirect("/dashboard")
}
