"use client"

import { FormError } from "@/components/forms/error"
import { SettingsPageHeader } from "@/components/settings/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useDownload } from "@/hooks/use-download"
import { useProgress } from "@/hooks/use-progress"
import { Download, Loader2 } from "lucide-react"
import { useActionState } from "react"
import { resetFieldsAndCategoriesAction, resetLLMSettingsAction, restoreBackupAction } from "./actions"

function SettingsSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 max-w-xl">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

export default function BackupSettingsPage() {
  const [restoreState, restoreBackup, restorePending] = useActionState(restoreBackupAction, null)

  const { isLoading, startProgress, progress } = useProgress({
    onError: (error) => {
      console.error("Backup progress error:", error)
    },
  })

  const { download, isDownloading } = useDownload({
    onError: (error) => {
      console.error("Download error:", error)
    },
  })

  const handleDownload = async () => {
    try {
      const progressId = await startProgress("backup")
      const downloadUrl = `/settings/backups/data?progressId=${progressId || ""}`
      await download(downloadUrl, "taxhacker-backup.zip")
    } catch (error) {
      console.error("Failed to start backup:", error)
    }
  }

  return (
    <div className="space-y-8">
      <SettingsPageHeader
        title="Backup & Restore"
        description="Download your data, restore from a backup, or reset settings to defaults."
      />

      <SettingsSection
        title="Download backup"
        description="Create a ZIP archive with all uploaded files and JSON exports of your transactions, categories, projects, fields, currencies, and settings."
      >
        <Button onClick={handleDownload} disabled={isLoading || isDownloading}>
          {isLoading ? (
            progress?.current ? (
              `Archiving ${progress.current}/${progress.total} files`
            ) : (
              "Preparing backup. Don't close the page..."
            )
          ) : isDownloading ? (
            "Archive is created. Downloading..."
          ) : (
            <>
              <Download className="mr-2" /> Download Data Archive
            </>
          )}
        </Button>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Restore from backup"
        description="Replace all current data with a previously downloaded archive. This action is irreversible — make a backup first."
      >
        <Card className="flex flex-col gap-2 p-5 bg-red-50 border-red-100">
          <form action={restoreBackup}>
            <div className="flex flex-col gap-4">
              <label>
                <input type="file" name="file" required />
              </label>
              <label className="flex flex-row gap-2 items-center">
                <input type="checkbox" name="removeExistingData" required />
                <span className="text-red-500">I understand that it will permanently delete all existing data</span>
              </label>
              <Button type="submit" variant="destructive" disabled={restorePending}>
                {restorePending ? (
                  <>
                    <Loader2 className="animate-spin" /> Restoring from backup... (it can take a while)
                  </>
                ) : (
                  "Restore from backup"
                )}
              </Button>
            </div>
          </form>
          {restoreState?.error && <FormError>{restoreState.error}</FormError>}
        </Card>

        {restoreState?.success && (
          <Card className="flex flex-col gap-2 p-5 bg-green-100">
            <h4 className="text-lg font-semibold">Backup restored successfully</h4>
            <p className="text-sm text-muted-foreground">You can now continue using the app. Import stats:</p>
            <ul className="list-disc list-inside">
              {Object.entries(restoreState.data?.counters || {}).map(([key, value]) => (
                <li key={key}>
                  <span className="font-bold">{key}</span>: {value} items
                </li>
              ))}
            </ul>
          </Card>
        )}
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Reset LLM settings"
        description="Reset the system prompt and other LLM settings to their default values. Use only if something is broken."
      >
        <form action={resetLLMSettingsAction}>
          <Button variant="destructive" type="submit">
            Reset main LLM prompt
          </Button>
        </form>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Reset fields, currencies and categories"
        description="Reset all fields, currencies, and categories to their default values. Use only if something is broken."
      >
        <form action={resetFieldsAndCategoriesAction}>
          <Button variant="destructive" type="submit">
            Reset fields, currencies and categories
          </Button>
        </form>
      </SettingsSection>
    </div>
  )
}
