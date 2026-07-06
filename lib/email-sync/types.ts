export type ImapAttachment = {
  filename: string
  contentType: string
  content: Buffer
  size: number
}

export type ImapMessage = {
  uid: number
  messageId?: string
  subject?: string
  from?: string
  date?: Date
  attachments: ImapAttachment[]
}

export type ImapConnectConfig = {
  user: string
  password: string
  host: string
  port: number
  tls: boolean
}

export type ImapSearchCriteria = Array<string | string[] | Date>

export type EmailServer = {
  id: string
  username: string
  password: string
  host: string
  port: number
  useSSL: boolean
  isActive: boolean
  lastProcessedUid?: number
  allowedExtensions: string[]
  lastSyncedAt?: string
  syncInterval?: number
  status: string
}

export type ImapClient = {
  fetchMessages: (config: ImapConnectConfig, criteria: ImapSearchCriteria[]) => Promise<ImapMessage[]>
}

export type SyncResult = {
  serverId: string
  processed: number
  lastProcessedUid?: number
  status: "connected" | "error"
  errorMessage?: string
}
