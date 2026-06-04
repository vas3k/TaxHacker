"use server"

import { getCurrentUser } from "@/lib/auth"
import { encryptSecret } from "@/lib/encryption"
import { getAppData, setAppData } from "@/models/apps"
import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { EmailAppData, EmailServer } from "./page"

const getDefaultAppData = (): EmailAppData => ({
  servers: [],
  globalSettings: {
    defaultExtensions: [".pdf", ".jpg", ".jpeg", ".png", ".docx", ".xlsx"],
    defaultSyncInterval: 1, // 1 hour
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
    // Mock implementation - in real app this would test IMAP connection
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate connection test

    const user = await getCurrentUser()
    const appData = (await getAppData(user, "email")) as EmailAppData | null

    if (!appData) {
      return { success: false, error: "No email servers found" }
    }

    // Update server status
    const updatedServers = appData.servers.map((server) =>
      server.id === serverId ? { ...server, status: "connected" as const, lastSync: new Date() } : server
    )

    const updatedData: EmailAppData = {
      ...appData,
      servers: updatedServers,
    }

    await setAppData(user, "email", updatedData)
    revalidatePath("/apps/email")

    return { success: true }
  } catch (error) {
    console.error("Error testing email connection:", error)
    return { success: false, error: "Connection test failed" }
  }
}

export async function syncEmailNowAction(serverId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Mock implementation - in real app this would trigger email sync
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate sync

    const user = await getCurrentUser()
    const appData = (await getAppData(user, "email")) as EmailAppData | null

    if (!appData) {
      return { success: false, error: "No email servers found" }
    }

    // Update last sync time
    const updatedServers = appData.servers.map((server) =>
      server.id === serverId ? { ...server, lastSync: new Date() } : server
    )

    const updatedData: EmailAppData = {
      ...appData,
      servers: updatedServers,
    }

    await setAppData(user, "email", updatedData)
    revalidatePath("/apps/email")

    return { success: true }
  } catch (error) {
    console.error("Error syncing emails:", error)
    return { success: false, error: "Failed to sync emails" }
  }
}
