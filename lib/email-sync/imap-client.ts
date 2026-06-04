import imaps from "imap-simple"
import { simpleParser } from "mailparser"
import { ImapClient, ImapConnectConfig, ImapMessage } from "./types"

function buildImapConfig(config: ImapConnectConfig) {
  return {
    imap: {
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      authTimeout: 10000,
      connTimeout: 10000,
      tlsOptions: { servername: config.host },
    },
  }
}

export const realImapClient: ImapClient = {
  async fetchMessages(config: ImapConnectConfig, criteria: any[]): Promise<ImapMessage[]> {
    const connection = await imaps.connect(buildImapConfig(config))

    try {
      await connection.openBox("INBOX")
      const fetchOptions = { bodies: [""], struct: true, markSeen: false }
      const results = await connection.search(criteria, fetchOptions)

      const messages: ImapMessage[] = []
      for (const item of results) {
        const uid = item.attributes.uid as number
        const rawPart = item.parts.find((p: any) => p.which === "")
        if (!rawPart) continue
        const parsed = await simpleParser(rawPart.body as string)
        messages.push({
          uid,
          messageId: parsed.messageId ?? undefined,
          subject: parsed.subject ?? undefined,
          from: parsed.from?.text,
          date: parsed.date ?? undefined,
          attachments: (parsed.attachments || []).map((a) => ({
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
  const connection = await imaps.connect(buildImapConfig(config))
  try {
    await connection.openBox("INBOX")
  } finally {
    connection.end()
  }
}
