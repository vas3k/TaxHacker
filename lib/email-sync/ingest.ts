import { Prisma } from "@/prisma/client"
import { prisma } from "@/lib/db"
import { decryptSecret } from "@/lib/encryption"
import { ingestUnsortedFile } from "@/lib/uploads"
import { getDirectorySize, getUserUploadsDirectory } from "@/lib/files"
import { updateUser } from "@/models/users"
import { File, User } from "@/prisma/client"
import { attachmentMatchesExtensions, buildSearchCriteria } from "./filters"
import { realImapClient } from "./imap-client"
import { EmailServer, ImapClient, SyncResult } from "./types"

type SyncDeps = {
  client?: ImapClient
  ingest?: (
    user: User,
    input: { buffer: Buffer; filename: string; mimetype: string; metadata?: Record<string, unknown> }
  ) => Promise<File>
}

export async function syncServer(server: EmailServer, user: User, deps: SyncDeps = {}): Promise<SyncResult> {
  const client = deps.client ?? realImapClient
  const ingest = deps.ingest ?? ingestUnsortedFile

  let password: string
  try {
    password = decryptSecret(server.password)
  } catch {
    return {
      serverId: server.id,
      processed: 0,
      lastProcessedUid: server.lastProcessedUid,
      status: "error",
      errorMessage:
        "Stored password could not be decrypted — please re-enter it (this happens if BETTER_AUTH_SECRET changed).",
    }
  }

  try {
    const messages = await client.fetchMessages(
      {
        user: server.username,
        password,
        host: server.host,
        port: server.port,
        tls: server.useSSL,
      },
      buildSearchCriteria(server)
    )

    let processed = 0
    const watermark = server.lastProcessedUid ?? 0
    let maxUid = watermark

    for (const message of [...messages].sort((a, b) => a.uid - b.uid)) {
      // Defend against the IMAP `UID n:*` quirk: `*` matches the highest existing UID,
      // so `(last+1):*` can re-return the watermark message when there is no newer mail.
      if (message.uid <= watermark) continue
      for (const attachment of message.attachments) {
        if (!attachmentMatchesExtensions(attachment.filename, server.allowedExtensions)) continue
        await ingest(user, {
          buffer: attachment.content,
          filename: attachment.filename,
          mimetype: attachment.contentType,
          metadata: {
            source: "email",
            emailServer: server.id,
            messageId: message.messageId,
            emailSubject: message.subject,
            emailFrom: message.from,
            emailDate: message.date?.toISOString(),
          },
        })
        processed++
      }
      if (message.uid > maxUid) maxUid = message.uid
    }

    return { serverId: server.id, processed, lastProcessedUid: maxUid, status: "connected" }
  } catch (error) {
    return {
      serverId: server.id,
      processed: 0,
      lastProcessedUid: server.lastProcessedUid,
      status: "error",
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }
}

async function applyResult(userId: string, result: SyncResult) {
  // Lock the row and re-read the CURRENT data inside the transaction so a concurrent sync
  // (the hourly cron container vs. a manual "Sync Now" in the web app) can't clobber the
  // other's watermark/status with a stale read-modify-write.
  await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ data: Record<string, unknown> }[]>`
      SELECT data FROM app_data WHERE user_id = ${userId}::uuid AND app = 'email' FOR UPDATE
    `
    if (!locked.length) return
    const data = locked[0].data as Record<string, unknown>
    const now = new Date().toISOString()
    data.servers = ((data.servers as EmailServer[]) || []).map((s) =>
      s.id === result.serverId
        ? {
            ...s,
            status: result.status,
            errorMessage: result.errorMessage ?? null,
            lastSyncedAt: now,
            lastProcessedUid: result.lastProcessedUid ?? s.lastProcessedUid,
          }
        : s
    )
    await tx.appData.update({ where: { userId_app: { userId, app: "email" } }, data: { data: data as Prisma.InputJsonValue } })
  })
}

// Per-server throttle: when the cron runs, skip a server whose last sync is more recent
// than its configured interval. Manual "Sync Now" passes respectInterval=false to bypass.
function isThrottled(server: EmailServer): boolean {
  if (!server.lastSyncedAt) return false
  const intervalMinutes = server.syncInterval ?? 60
  const elapsedMinutes = (Date.now() - new Date(server.lastSyncedAt).getTime()) / 60_000
  return elapsedMinutes < intervalMinutes
}

export async function runEmailSync(
  scope: { userId?: string; serverId?: string; respectInterval?: boolean } = {}
): Promise<SyncResult[]> {
  const rows = await prisma.appData.findMany({
    where: { app: "email", ...(scope.userId ? { userId: scope.userId } : {}) },
    include: { user: true },
  })

  const results: SyncResult[] = []
  for (const row of rows) {
    const data = row.data as Record<string, unknown>
    const servers: EmailServer[] = ((data?.servers as EmailServer[]) || []).filter(
      (s) => s.isActive && (!scope.serverId || s.id === scope.serverId)
    )
    for (const server of servers) {
      if (scope.respectInterval && isThrottled(server)) continue
      const result = await syncServer(server, row.user)
      await applyResult(row.userId, result)
      if (result.processed > 0) {
        await updateUser(row.userId, { storageUsed: await getDirectorySize(getUserUploadsDirectory(row.user)) })
      }
      results.push(result)
    }
  }
  return results
}
