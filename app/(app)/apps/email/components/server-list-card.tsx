"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical,
  Pause,
  Play,
  RefreshCw,
  Settings2,
  Trash2,
  Wifi,
} from "lucide-react"
import { toast } from "sonner"
import {
  deleteEmailServerAction,
  syncEmailNowAction,
  testEmailConnectionAction,
  updateEmailServerAction,
} from "../actions"
import { EmailServer } from "../page"
import { EMAIL_PROVIDER_PRESETS } from "../presets"

type ServerListCardProps = {
  servers: EmailServer[]
  onEditServer: (server: EmailServer) => void
  isPending: boolean
}

const getStatusBadge = (status: EmailServer["status"]) => {
  switch (status) {
    case "connected":
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      )
    case "error":
      return (
        <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      )
    case "pending":
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      )
    case "paused":
      return (
        <Badge variant="outline">
          <Pause className="w-3 h-3 mr-1" />
          Paused
        </Badge>
      )
    default:
      return <Badge variant="secondary">Unknown</Badge>
  }
}

export function ServerListCard({ servers, onEditServer, isPending }: ServerListCardProps) {
  const handleDeleteServer = async (serverId: string) => {
    const result = await deleteEmailServerAction(serverId)
    if (result.success) {
      toast.success("Email server deleted successfully")
    } else {
      toast.error(result.error || "Failed to delete email server")
    }
  }

  const handleTestConnection = async (serverId: string) => {
    const result = await testEmailConnectionAction(serverId)
    if (result.success) {
      toast.success("Connection test successful")
    } else {
      toast.error(result.error || "Connection test failed")
    }
  }

  const handleSyncNow = async (serverId: string) => {
    const result = await syncEmailNowAction(serverId)
    if (result.success) {
      toast.success("Email sync completed")
    } else {
      toast.error(result.error || "Failed to sync emails")
    }
  }

  const toggleServerStatus = async (server: EmailServer) => {
    const newStatus = server.status === "paused" ? "pending" : "paused"
    const result = await updateEmailServerAction(server.id, {
      status: newStatus,
      isActive: newStatus !== "paused",
    })
    if (!result.success) {
      toast.error(result.error || "Failed to update server status")
    }
  }

  if (servers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-muted-foreground text-center">
            <h3 className="font-medium mb-2">No email servers configured</h3>
            <p className="text-sm">Add your first email server to start monitoring incoming emails</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {servers.map((server) => (
        <Card key={server.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-lg">{server.username}</CardTitle>
                <CardDescription>
                  {EMAIL_PROVIDER_PRESETS[server.provider]?.name || server.provider} • {server.host}:{server.port}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditServer(server)}>
                    <Settings2 className="w-4 h-4 mr-2" />
                    Edit Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTestConnection(server.id)}>
                    <Wifi className="w-4 h-4 mr-2" />
                    Test Connection
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleServerStatus(server)}>
                    {server.status === "paused" ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteServer(server.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div>
                  {getStatusBadge(server.status)}
                  {server.status === "error" && server.errorMessage && (
                    <p className="text-sm text-red-600 mt-1">{server.errorMessage}</p>
                  )}
                </div>
                {(() => {
                  const lastSyncValue = server.lastSyncedAt ?? server.lastSync
                  return lastSyncValue ? (
                    <span className="text-sm text-muted-foreground">
                      Last sync: {new Date(lastSyncValue).toLocaleString()}
                    </span>
                  ) : null
                })()}
                <span className="text-sm text-muted-foreground">Extensions: {server.allowedExtensions.join(", ")}</span>
              </div>
              <div className="flex space-x-2">
                {server.status === "connected" && (
                  <Button variant="outline" size="sm" onClick={() => handleSyncNow(server.id)} disabled={isPending}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Sync Now
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
