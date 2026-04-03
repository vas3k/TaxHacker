import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Health check endpoint for Docker and Portainer
 * Returns 200 if app and database are healthy
 */
export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        features: {
          receiptMatching: process.env.RECEIPT_MATCH_ENABLED !== "false",
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Health check failed:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    )
  }
}
