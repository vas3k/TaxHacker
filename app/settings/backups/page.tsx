"use client"

import { FormError } from "@/components/forms/error"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Loader2 } from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"
import { restoreBackupAction } from "./actions"

export default function BackupSettingsPage() {
  const [restoreState, restoreBackup, restorePending] = useActionState(restoreBackupAction, null)

  return (
    <div className="container flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Download backup</h1>
        <div className="flex flex-row gap-4">
          <Link href="/settings/backups/database">
            <Button>
              <Download /> Download database.sqlite
            </Button>
          </Link>
          <Link href="/settings/backups/files">
            <Button>
              <Download /> Download files archive
            </Button>
          </Link>
        </div>
        <div className="text-sm text-muted-foreground">
          You can use any SQLite client to view the database.sqlite file contents
        </div>
      </div>

      <Card className="flex flex-col gap-4 mt-24 p-5 bg-red-100 max-w-xl">
        <h2 className="text-xl font-semibold">Restore database from backup</h2>
        <div className="text-sm text-muted-foreground">
          Warning: This will overwrite your current database and destroy all the data! Don't forget to download backup
          first.
        </div>
        <form action={restoreBackup}>
          <label>
            <input type="file" name="file" />
          </label>
          <Button type="submit" variant="destructive" disabled={restorePending}>
            {restorePending ? (
              <>
                <Loader2 className="animate-spin" /> Uploading new database...
              </>
            ) : (
              "Restore"
            )}
          </Button>
        </form>
        {restoreState?.error && <FormError>{restoreState.error}</FormError>}
      </Card>
    </div>
  )
}
