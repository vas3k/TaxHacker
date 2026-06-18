"use server"

import { getCurrentUser } from "@/lib/auth"
import { encryptSecret, decryptSecret } from "@/lib/encryption"
import { testImapConnection } from "@/lib/email-sync/imap-client"
import { runEmailSync } from "@/lib/email-sync/ingest"
import { getAppData, setAppData } from "@/models/apps"
import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { EmailAppData, EmailServer } from "./page"

const getDefaultAppData = (): EmailAppData => ({
  servers: [],
  globalSettings: {
    defaultExtensions: [".pdf", ".jpg", ".jpeg", ".png", ".docx", ".xlsx"],
    defaultSyncInterval: 60, // minutes (hourly)
  },
})

export async function addEmailServerAction(
  serverData: Omit<EmailServer, "id" | "status" | "lastSync" | "addedAt">
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    const appData = (await getAppData(user, "email")) as EmailAppData | null
    const currentData = appData || getDefaultAppData()

    const newServer: EmailServer = {
      ...serverData,
      id: randomUUID(),
      status: "pending",
      lastSync: undefined,
      addedAt: new Date().toISOString(),
      password: encryptSecret(serverData.password),
    }

    const updatedData: EmailAppData = {
      ...currentData,
      servers: [...currentData.servers, newServer],
    }

    await setAppData(user, "email", updatedData)
    revalidatePath("/apps/email")

    return { success: true }
  } catch (error) {
    console.error("Error adding email server:", error)
    return { success: false, error: "Failed to add email server" }
  }
}

export async function updateEmailServerAction(
  serverId: string,
  serverData: Partial<EmailServer>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    const appData = (await getAppData(user, "email")) as EmailAppData | null

    if (!appData) {
      return { success: false, error: "No email servers found" }
    }

    const patch = { ...serverData }
    if (typeof patch.password === "string" && patch.password.length > 0) {
      patch.password = encryptSecret(patch.password)
    } else {
      delete patch.password
    }

    const updatedServers = appData.servers.map((server) =>
      server.id === serverId ? { ...server, ...patch } : server
    )

    const updatedData: EmailAppData = {
      ...appData,
      servers: updatedServers,
    }

    await setAppData(user, "email", updatedData)
    revalidatePath("/apps/email")

    return { success: true }
  } catch (error) {
    console.error("Error updating email server:", error)
    return { success: false, error: "Failed to update email server" }
  }
}

export async function deleteEmailServerAction(serverId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    const appData = (await getAppData(user, "email")) as EmailAppData | null

    if (!appData) {
      return { success: false, error: "No email servers found" }
    }

    const updatedServers = appData.servers.filter((server) => server.id !== serverId)

    const updatedData: EmailAppData = {
      ...appData,
      servers: updatedServers,
    }

    await setAppData(user, "email", updatedData)
    revalidatePath("/apps/email")

    return { success: true }
  } catch (error) {
    console.error("Error deleting email server:", error)
    return { success: false, error: "Failed to delete email server" }
  }
}

export async function testEmailConnectionAction(serverId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    const appData = (await getAppData(user, "email")) as EmailAppData | null
    if (!appData) return { success: false, error: "No email servers found" }
    const server = appData.servers.find((s) => s.id === serverId)
    if (!server) return { success: false, error: "Server not found" }

    let status: EmailServer["status"] = "connected"
    let errorMessage: string | undefined
    try {
      await testImapConnection({
        user: server.username,
        password: decryptSecret(server.password),
        host: server.host,
        port: server.port,
        tls: server.useSSL,
      })
    } catch (e) {
      status = "error"
      errorMessage = e instanceof Error ? e.message : String(e)
    }

    const updatedData: EmailAppData = {
      ...appData,
      servers: appData.servers.map((s) =>
        s.id === serverId ? { ...s, status, errorMessage, lastSync: new Date() } : s
      ),
    }
    await setAppData(user, "email", updatedData)
    revalidatePath("/apps/email")
    return status === "connected" ? { success: true } : { success: false, error: errorMessage }
  } catch (error) {
    console.error("Error testing email connection:", error)
    return { success: false, error: "Connection test failed" }
  }
}

export async function syncEmailNowAction(serverId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    const results = await runEmailSync({ userId: user.id, serverId })
    revalidatePath("/apps/email")
    const failed = results.find((r) => r.status === "error")
    if (failed) return { success: false, error: failed.errorMessage || "Sync failed" }
    return { success: true }
  } catch (error) {
    console.error("Error syncing emails:", error)
    return { success: false, error: "Failed to sync emails" }
  }
}
