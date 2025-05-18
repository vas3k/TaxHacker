import { getCurrentUser } from "@/lib/auth"
import { TaxAdvisorComponent } from "./components/tax-advisor"
import { manifest } from "./manifest"

export default async function TaxAdvisorApp() {
  const user = await getCurrentUser()

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-2 mb-8">
        <h2 className="flex flex-row gap-3 md:gap-5">
          <span className="text-3xl font-bold tracking-tight">
            {manifest.icon} {manifest.name}
          </span>
        </h2>
      </header>
      <TaxAdvisorComponent user={user} />
    </div>
  )
}
