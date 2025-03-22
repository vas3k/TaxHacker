import DashboardDropZoneWidget from "@/components/dashboard/drop-zone-widget"
import { StatsWidget } from "@/components/dashboard/stats-widget"
import DashboardUnsortedWidget from "@/components/dashboard/unsorted-widget"
import { WelcomeWidget } from "@/components/dashboard/welcome-widget"
import { Separator } from "@/components/ui/separator"
import { getUnsortedFiles } from "@/models/files"
import { getSettings } from "@/models/settings"
import { TransactionFilters } from "@/models/transactions"

export default async function Home({ searchParams }: { searchParams: Promise<TransactionFilters> }) {
  const filters = await searchParams
  const unsortedFiles = await getUnsortedFiles()
  const settings = await getSettings()

  return (
    <div className="flex flex-col gap-5 p-5 w-full max-w-7xl self-center">
      <div className="flex flex-col sm:flex-row gap-5 items-stretch h-full">
        <DashboardDropZoneWidget />

        <DashboardUnsortedWidget files={unsortedFiles} />
      </div>

      {settings.is_welcome_message_hidden !== "true" && <WelcomeWidget />}

      <Separator />

      <StatsWidget filters={filters} />
    </div>
  )
}
