"use client"

import { SettingsMap } from "@/models/settings"
import { User } from "@/prisma/client"
import { useState, useTransition } from "react"
import { EmailAppData, EmailServer } from "../page"
import { AddServerDialog } from "./add-server-dialog"
import { EditServerDialog } from "./edit-server-dialog"
import { ManualSyncButton } from "./manual-sync-button"
import { ServerListCard } from "./server-list-card"

type EmailServerManagerProps = {
  user: User
  settings: SettingsMap
  appData: EmailAppData | null
}

const getDefaultAppData = (): EmailAppData => ({
  servers: [],
  globalSettings: {
    defaultExtensions: [".pdf", ".jpg", ".jpeg", ".png", ".docx", ".xlsx"],
    defaultSyncInterval: 60,
  },
})

export function EmailServerManager({ appData }: EmailServerManagerProps) {
  const data = appData || getDefaultAppData()
  const [editingServer, setEditingServer] = useState<EmailServer | null>(null)
  const [isPending] = useTransition()

  return (
    <div className="space-y-6">
      {/* Header with Add Server button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Email Servers</h3>
          <p className="text-sm text-muted-foreground">
            Manage your email servers to monitor incoming emails with attachments
          </p>
        </div>
        <div className="flex gap-2">
          <ManualSyncButton isPending={isPending} />
          <AddServerDialog isPending={isPending} />
        </div>
      </div>

      {/* Server List */}
      <ServerListCard servers={data.servers} onEditServer={setEditingServer} isPending={isPending} />

      {/* Edit Server Dialog */}
      <EditServerDialog
        server={editingServer}
        isOpen={!!editingServer}
        onClose={() => setEditingServer(null)}
        isPending={isPending}
      />
    </div>
  )
}
