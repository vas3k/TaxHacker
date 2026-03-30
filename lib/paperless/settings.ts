import { getSettings } from "@/models/settings"
import { createPaperlessClient, PaperlessClient } from "./client"

export async function getPaperlessClientForUser(
  userId: string
): Promise<{ client: PaperlessClient; settings: Record<string, string> } | null> {
  const settings = await getSettings(userId)

  if (settings.paperless_enabled !== "true") return null
  if (!settings.paperless_url || !settings.paperless_api_token) return null

  const client = createPaperlessClient(settings.paperless_url, settings.paperless_api_token)
  return { client, settings }
}
