import { prisma } from "@/lib/db"
import { decryptSecret } from "@/lib/encryption"
import { ingestUnsortedFile } from "@/lib/uploads"
import { getDirectorySize, getUserUploadsDirectory } from "@/lib/files"
import { updateUser } from "@/models/users"
import { File, User } from "@/prisma/client"
import { attachmentMatchesExtensions, buildSearchCriteria } from "./filters"
import { realImapClient } from "./imap-client"
import { ImapClient, SyncResult } from "./types"

type SyncDeps = {
  client?: ImapClient
  ingest?: (
    user: User,
    input: { buffer: Buffer; filename: string; mimetype: string; metadata?: Record<string, unknown> }
  ) => Promise<File>
}

export async function syncServer(server: any, user: User, deps: SyncDeps = {}): Promise<SyncResult> {
  const client = deps.client ?? realImapClient
  const ingest = deps.ingest ?? ingestUnsortedFile

  try {
    const messages = await client.fetchMessages(
      {
        user: server.username,
        password: decryptSecret(server.password),
        host: server.host,
        port: server.port,
        tls: server.useSSL,
      },
      buildSearchCriteria(server)
    )

    let processed = 0
    let maxUid = server.lastProcessedUid ?? 0

    for (const message of [...messages].sort((a, b) => a.uid - b.uid)) {
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
  const row = await prisma.appData.findUnique({ where: { userId_app: { userId, app: "email" } } })
  if (!row) return
  const data = row.data as any
  const now = new Date().toISOString()
  data.servers = (data.servers || []).map((s: any) =>
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
  await prisma.appData.update({ where: { userId_app: { userId, app: "email" } }, data: { data } })
}

export async function runEmailSync(scope: { userId?: string; serverId?: string } = {}): Promise<SyncResult[]> {
  const rows = await prisma.appData.findMany({
    where: { app: "email", ...(scope.userId ? { userId: scope.userId } : {}) },
    include: { user: true },
  })

  const results: SyncResult[] = []
  for (const row of rows) {
    const data = row.data as any
    const servers: any[] = (data?.servers || []).filter(
      (s: any) => s.isActive && (!scope.serverId || s.id === scope.serverId)
    )
    for (const server of servers) {
      const result = await syncServer(server, row.user)
      await applyResult(row.userId, result)
      await updateUser(row.userId, { storageUsed: await getDirectorySize(getUserUploadsDirectory(row.user)) })
      results.push(result)
    }
  }
  return results
}
