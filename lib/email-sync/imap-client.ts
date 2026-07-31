import imaps from "imap-simple"
import { simpleParser } from "mailparser"
import { validateImapTarget } from "./imap-validation"
import { ImapClient, ImapConnectConfig, ImapMessage, ImapSearchCriteria } from "./types"

function buildImapConfig(config: ImapConnectConfig) {
  return {
    imap: {
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      authTimeout: 5000,
      connTimeout: 5000,
      tlsOptions: { servername: config.host },
    },
  }
}

async function connectWithImap(config: ImapConnectConfig) {
  const maxAttempts = 1
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await imaps.connect(buildImapConfig(config))
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error("IMAP connection failed")
}

export const realImapClient: ImapClient = {
  async fetchMessages(config: ImapConnectConfig, criteria: ImapSearchCriteria[]): Promise<ImapMessage[]> {
    await validateImapTarget(config.host, config.port)
    const connection = await connectWithImap(config)

    try {
      await connection.openBox("INBOX")
      const fetchOptions = { bodies: [""], struct: true, markSeen: false }
      const results = await connection.search(criteria, fetchOptions)

      const messages: ImapMessage[] = []
      for (const item of results) {
        const uid = item.attributes.uid as number
        const rawPart = item.parts.find((p: { which: string }) => p.which === "")
        if (!rawPart) continue
        const parsed = await simpleParser(rawPart.body as string)
        messages.push({
          uid,
          messageId: parsed.messageId ?? undefined,
          subject: parsed.subject ?? undefined,
          from: parsed.from?.text,
          date: parsed.date ?? undefined,
          // Skip parts without real Buffer content (inline/streamed parts) so a missing
          // `.content` can't throw on `.length` and crash the whole server's sync.
          attachments: (parsed.attachments || [])
            .filter((a) => Buffer.isBuffer(a.content))
            .map((a) => ({
              filename: a.filename || "attachment",
              contentType: a.contentType || "application/octet-stream",
              content: a.content as Buffer,
              size: a.size ?? (a.content as Buffer).length,
            })),
        })
      }
      return messages
    } finally {
      connection.end()
    }
  },
}

export async function testImapConnection(config: ImapConnectConfig): Promise<void> {
  await validateImapTarget(config.host, config.port)
  const connection = await connectWithImap(config)
  try {
    await connection.openBox("INBOX")
  } finally {
    connection.end()
  }
}
