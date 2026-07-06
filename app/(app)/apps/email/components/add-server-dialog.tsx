"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { addEmailServerAction } from "../actions"
import { EmailProvider, EmailServer } from "../page"
import { EMAIL_PROVIDER_PRESETS } from "../presets"
import { ProviderSelectionGrid } from "./provider-selection-grid"
import { ServerConfigForm } from "./server-config-form"

type AddServerDialogProps = {
  isPending: boolean
}

type AddServerStep = "provider-selection" | "configuration"

export function AddServerDialog({ isPending }: AddServerDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<AddServerStep>("provider-selection")
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider | null>(null)

  const handleProviderSelect = (provider: EmailProvider) => {
    setSelectedProvider(provider)
    setStep("configuration")
  }

  const handleAddServer = async (serverData: Omit<EmailServer, "id" | "status" | "lastSync" | "addedAt">) => {
    const result = await addEmailServerAction(serverData)
    if (result.success) {
      toast.success("Email server added successfully")
      handleClose()
    } else {
      toast.error(result.error || "Failed to add email server")
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setStep("provider-selection")
    setSelectedProvider(null)
  }

  const handleBack = () => {
    setStep("provider-selection")
    setSelectedProvider(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Server
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        {step === "provider-selection" ? (
          <>
            <DialogHeader>
              <DialogTitle>Choose Email Provider</DialogTitle>
              <DialogDescription>Select your email provider to get started</DialogDescription>
            </DialogHeader>
            <ProviderSelectionGrid onProviderSelect={handleProviderSelect} />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Configure Email Server</DialogTitle>
              <DialogDescription>
                {selectedProvider && EMAIL_PROVIDER_PRESETS[selectedProvider] && (
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">{EMAIL_PROVIDER_PRESETS[selectedProvider].icon}</span>
                    {EMAIL_PROVIDER_PRESETS[selectedProvider].name} -{" "}
                    {EMAIL_PROVIDER_PRESETS[selectedProvider].description}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <ServerConfigForm
              selectedProvider={selectedProvider}
              onSubmit={handleAddServer}
              onCancel={handleClose}
              onBack={handleBack}
              isPending={isPending}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
