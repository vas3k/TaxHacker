"use server"

import { ActionState } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { createPaperlessClient } from "@/lib/paperless/client"

export async function testPaperlessConnectionAction(
  _prevState: ActionState<{ documentCount: number }> | null,
  formData: FormData
): Promise<ActionState<{ documentCount: number }>> {
  await getCurrentUser()

  const url = formData.get("paperless_url") as string
  const token = formData.get("paperless_api_token") as string

  if (!url || !token) {
    return { success: false, error: "URL and API token are required" }
  }

  try {
    const client = createPaperlessClient(url, token)
    const result = await client.listDocuments({ page: 1, page_size: 1 })
    return { success: true, data: { documentCount: result.count } }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Connection failed" }
  }
}
