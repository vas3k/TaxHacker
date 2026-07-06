"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { updateEmailServerAction } from "../actions"
import { EmailServer } from "../page"
import { ServerConfigForm } from "./server-config-form"

type EditServerDialogProps = {
  server: EmailServer | null
  isOpen: boolean
  onClose: () => void
  isPending: boolean
}

export function EditServerDialog({ server, isOpen, onClose, isPending }: EditServerDialogProps) {
  const handleUpdateServer = async (serverData: Omit<EmailServer, "id" | "status" | "lastSync" | "addedAt">) => {
    if (!server) return

    const result = await updateEmailServerAction(server.id, serverData)
    if (result.success) {
      toast.success("Email server updated successfully")
      onClose()
    } else {
      toast.error(result.error || "Failed to update email server")
    }
  }

  if (!server) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Email Server</DialogTitle>
          <DialogDescription>Update your email server configuration</DialogDescription>
        </DialogHeader>
        <ServerConfigForm server={server} onSubmit={handleUpdateServer} onCancel={onClose} isPending={isPending} />
      </DialogContent>
    </Dialog>
  )
}
