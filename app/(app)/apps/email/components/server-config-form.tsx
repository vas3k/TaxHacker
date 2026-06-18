"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { EmailProvider, EmailServer } from "../page"
import { EMAIL_PROVIDER_PRESETS } from "../presets"

const SYNC_INTERVAL_OPTIONS = [
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 60, label: "Hourly" },
  { value: 360, label: "Every 6 hours" },
  { value: 720, label: "Every 12 hours" },
  { value: 1440, label: "Daily" },
]

type ServerConfigFormProps = {
  server?: EmailServer
  selectedProvider?: EmailProvider | null
  onSubmit: (data: Omit<EmailServer, "id" | "status" | "lastSync" | "addedAt">) => void
  onCancel: () => void
  onBack?: () => void
  isPending: boolean
}

export function ServerConfigForm({
  server,
  selectedProvider,
  onSubmit,
  onCancel,
  onBack,
  isPending,
}: ServerConfigFormProps) {
  const provider = selectedProvider || server?.provider || "gmail"
  const preset = EMAIL_PROVIDER_PRESETS[provider]

  const [formData, setFormData] = useState({
    name: server?.username || "", // Use username as name
    provider: provider,
    host: server?.host || preset?.host || "",
    port: server?.port || preset?.port || 993,
    username: server?.username || "",
    password: "",
    useSSL: server?.useSSL ?? preset?.useSSL ?? true,
    isActive: server?.isActive ?? true,
    allowedExtensions: server?.allowedExtensions || [".pdf", ".jpg", ".jpeg", ".png"],
    syncInterval: server?.syncInterval || 60,
    initialSince: server?.initialSince || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Auto-generate name from username if not editing existing server
    const serverData = {
      ...formData,
      name: server?.name || formData.username, // Use username as server name
    }

    onSubmit(serverData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="host">IMAP Host</Label>
          <Input
            id="host"
            value={formData.host}
            onChange={(e) => setFormData((prev) => ({ ...prev, host: e.target.value }))}
            placeholder="imap.gmail.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="port">Port</Label>
          <Input
            id="port"
            type="number"
            value={formData.port}
            onChange={(e) => setFormData((prev) => ({ ...prev, port: parseInt(e.target.value) }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="username">Email Address</Label>
          <Input
            id="username"
            type="email"
            value={formData.username}
            onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
            placeholder="your-email@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">
            Password/App Password
            {server && <span className="ml-1 text-xs text-muted-foreground">(leave blank to keep current)</span>}
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Your app password"
            required={!server}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="extensions">Allowed File Extensions (comma-separated)</Label>
          <Input
            id="extensions"
            value={formData.allowedExtensions.join(", ")}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                allowedExtensions: e.target.value
                  .split(",")
                  .map((ext) => ext.trim())
                  .filter(Boolean),
              }))
            }
            placeholder=".pdf, .jpg, .png, .docx"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="syncInterval">Sync frequency</Label>
          <Select
            value={String(formData.syncInterval)}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, syncInterval: parseInt(value) }))}
          >
            <SelectTrigger id="syncInterval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYNC_INTERVAL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="initialSince">
          Fetch emails since
          <span className="ml-1 text-xs text-muted-foreground">(blank = entire mailbox; only applies to the first sync)</span>
        </Label>
        <Input
          id="initialSince"
          type="date"
          value={formData.initialSince}
          onChange={(e) => setFormData((prev) => ({ ...prev, initialSince: e.target.value }))}
        />
      </div>

      <div className="flex justify-between pt-4">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack}>
            ← Back
          </Button>
        )}
        <div className="flex space-x-2 ml-auto">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : server ? "Update Server" : "Add Server"}
          </Button>
        </div>
      </div>
    </form>
  )
}
