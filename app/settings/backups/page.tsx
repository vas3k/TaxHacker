"use client"

import { FormError } from "@/components/forms/error"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download } from "lucide-react"
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
          <Link href="/settings/backups/data">
            <Button>
              <Download /> Download data directory
            </Button>
          </Link>
        </div>
        <div className="text-sm text-muted-foreground max-w-xl">
          The archive consists of all uploaded files and the SQLite database. You can view the contents of the database
          using any SQLite viewer.
        </div>
      </div>

      <Card className="flex flex-col gap-4 mt-16 p-5 bg-red-100 max-w-xl">
        <h2 className="text-xl font-semibold">How to restore from a backup</h2>
        <div className="text-md">
          This feature doesn't work automatically yet. Use your docker deployment with backup archive to manually put
          database.sqlite and uploaded files into the paths specified in DATABASE_URL and UPLOAD_PATH
        </div>
        {/* <form action={restoreBackup}>
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
        </form> */}
        {restoreState?.error && <FormError>{restoreState.error}</FormError>}
      </Card>
    </div>
  )
}
