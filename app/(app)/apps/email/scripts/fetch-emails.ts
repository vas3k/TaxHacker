#!/usr/bin/env npx tsx
import { runEmailSync } from "@/lib/email-sync/ingest"
import { prisma } from "@/lib/db"

async function main() {
  console.log(`🚀 Starting email sync at ${new Date().toISOString()}`)
  const results = await runEmailSync()
  const total = results.reduce((acc, r) => acc + r.processed, 0)
  const errored = results.filter((r) => r.status === "error")
  console.log(`✅ Email sync complete. Servers: ${results.length}, attachments: ${total}, errors: ${errored.length}`)
  for (const e of errored) console.error(`   ❌ ${e.serverId}: ${e.errorMessage}`)
}

main()
  .catch((error) => {
    console.error("💥 Fatal error during email sync:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export { runEmailSync as fetchEmails }
