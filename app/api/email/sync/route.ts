import { fetchEmails } from "@/app/(app)/apps/email/scripts/fetch-emails"
import { getCurrentUser } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(_request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`🔄 Manual email sync triggered by user: ${user.email}`)

    // Run the email sync
    await fetchEmails()

    return NextResponse.json({
      success: true,
      message: "Email sync completed successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error in manual email sync:", error)

    return NextResponse.json(
      {
        error: "Email sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      message: "Email sync API is ready",
      endpoint: "/api/email/sync",
      methods: ["POST"],
      description: "Trigger manual email synchronization",
    })
  } catch (_error) {
    return NextResponse.json({ error: "Failed to get sync status" }, { status: 500 })
  }
}
