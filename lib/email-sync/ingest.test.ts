import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

// --- import-time mocks so importing ./ingest doesn't run config Zod validation or create a Prisma client ---
vi.mock("@/lib/uploads", () => ({ ingestUnsortedFile: vi.fn() }))
vi.mock("@/lib/db", () => {
  // applyResult now locks + re-reads inside a transaction; provide a tx with $queryRaw + update.
  const tx = { $queryRaw: vi.fn(async () => [{ data: { servers: [] } }]), appData: { update: vi.fn() } }
  return {
    prisma: { appData: { findMany: vi.fn() }, $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(tx)) },
  }
})
vi.mock("@/lib/files", () => ({ getDirectorySize: vi.fn(), getUserUploadsDirectory: vi.fn(() => "dir") }))
vi.mock("@/models/users", () => ({ updateUser: vi.fn() }))
vi.mock("@/lib/email-sync/imap-client", () => ({ realImapClient: { fetchMessages: vi.fn() } }))

const { syncServer, runEmailSync } = await import("./ingest")
import { prisma } from "@/lib/db"
import { realImapClient } from "@/lib/email-sync/imap-client"
import { getDirectorySize } from "@/lib/files"
import { ingestUnsortedFile } from "@/lib/uploads"
import { File, User } from "@/prisma/client"
import { EmailServer, ImapClient, ImapMessage } from "./types"

beforeAll(() => {
  process.env.BETTER_AUTH_SECRET = "test-secret-key-for-encryption-unit-tests"
})

const user = { id: "user-1", email: "u@example.com", storageUsed: 0, storageLimit: -1 } as unknown as User

function makeServer(overrides: Partial<EmailServer> = {}): EmailServer {
  return {
    id: "srv-1", name: "Inbox", provider: "custom", host: "imap.example.com", port: 993,
    username: "u@example.com", password: "plaintext-pw", useSSL: true, isActive: true,
    status: "pending", allowedExtensions: [".pdf"], syncInterval: 1,
    addedAt: "2026-06-01T00:00:00.000Z", ...overrides,
  }
}

function fakeClient(messages: ImapMessage[]): ImapClient {
  return { fetchMessages: vi.fn(async () => messages) }
}

describe("syncServer", () => {
  it("ingests matching attachments and advances the UID watermark", async () => {
    const ingested: { filename: string }[] = []
    const messages: ImapMessage[] = [
      {
        uid: 10, messageId: "<a@x>", subject: "Invoice", from: "biz@x.com", date: new Date(),
        attachments: [
          { filename: "invoice.pdf", contentType: "application/pdf", content: Buffer.from("pdf"), size: 3 },
          { filename: "logo.gif", contentType: "image/gif", content: Buffer.from("gif"), size: 3 },
        ],
      },
      { uid: 12, attachments: [{ filename: "receipt.pdf", contentType: "application/pdf", content: Buffer.from("r"), size: 1 }] },
    ]

    const result = await syncServer(makeServer(), user, {
      client: fakeClient(messages),
      ingest: async (_u, input) => { ingested.push(input); return { id: "f", ...input } as unknown as File },
    })

    expect(ingested.map((i) => i.filename)).toEqual(["invoice.pdf", "receipt.pdf"])
    expect(result.processed).toBe(2)
    expect(result.lastProcessedUid).toBe(12)
    expect(result.status).toBe("connected")
  })

  it("does not advance the watermark when there are no new messages", async () => {
    const result = await syncServer(makeServer({ lastProcessedUid: 5 }), user, {
      client: fakeClient([]), ingest: async () => ({}) as unknown as File,
    })
    expect(result.processed).toBe(0)
    expect(result.lastProcessedUid).toBe(5)
    expect(result.status).toBe("connected")
  })

  it("skips messages at or below the watermark (defends against the IMAP `UID n:*` re-fetch quirk)", async () => {
    const ingested: { filename: string }[] = []
    // Some servers (Gmail/Dovecot) return the highest existing UID for `UID (last+1):*`
    // when there is no newer mail — re-delivering the watermark message.
    const result = await syncServer(makeServer({ lastProcessedUid: 603 }), user, {
      client: fakeClient([
        { uid: 603, attachments: [{ filename: "dup.pdf", contentType: "application/pdf", content: Buffer.from("x"), size: 1 }] },
      ]),
      ingest: async (_u, input) => { ingested.push(input); return { id: "f" } as unknown as File },
    })
    expect(ingested).toHaveLength(0)
    expect(result.processed).toBe(0)
    expect(result.lastProcessedUid).toBe(603)
  })

  it("returns a friendly error when the stored password cannot be decrypted", async () => {
    const result = await syncServer(makeServer({ password: "v1:bad:bad:bad", lastProcessedUid: 9 }), user, {
      client: fakeClient([]),
      ingest: async () => ({}) as unknown as File,
    })
    expect(result.status).toBe("error")
    expect(result.errorMessage).toMatch(/could not be decrypted/i)
    expect(result.lastProcessedUid).toBe(9)
  })

  it("reports error status and keeps the old watermark on client failure", async () => {
    const result = await syncServer(makeServer({ lastProcessedUid: 7 }), user, {
      client: { fetchMessages: vi.fn(async () => { throw new Error("auth failed") }) },
      ingest: async () => ({}) as unknown as File,
    })
    expect(result.status).toBe("error")
    expect(result.errorMessage).toContain("auth failed")
    expect(result.lastProcessedUid).toBe(7)
  })
})

describe("runEmailSync storage recompute guard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.appData.findMany).mockResolvedValue([
      { userId: "u1", user, data: { servers: [makeServer()] } },
    ] as unknown as File)
  })

  it("skips getDirectorySize when nothing was ingested (regression: ENOENT on missing uploads dir)", async () => {
    vi.mocked(realImapClient.fetchMessages).mockResolvedValue([]) // 0 attachments
    await runEmailSync()
    expect(getDirectorySize).not.toHaveBeenCalled()
  })

  it("recomputes storage when at least one attachment was ingested", async () => {
    vi.mocked(realImapClient.fetchMessages).mockResolvedValue([
      { uid: 20, attachments: [{ filename: "a.pdf", contentType: "application/pdf", content: Buffer.from("x"), size: 1 }] },
    ])
    vi.mocked(ingestUnsortedFile).mockResolvedValue({ id: "f" } as unknown as File)
    vi.mocked(getDirectorySize).mockResolvedValue(123)
    await runEmailSync()
    expect(getDirectorySize).toHaveBeenCalledTimes(1)
  })

  it("cron run (respectInterval) skips a server still within its syncInterval", async () => {
    vi.mocked(prisma.appData.findMany).mockResolvedValue([
      { userId: "u1", user, data: { servers: [makeServer({ lastSyncedAt: new Date().toISOString(), syncInterval: 6 })] } },
    ] as unknown as File)
    const results = await runEmailSync({ respectInterval: true })
    expect(realImapClient.fetchMessages).not.toHaveBeenCalled()
    expect(results).toHaveLength(0)
  })

  it("treats syncInterval as MINUTES: a server synced 90 min ago with interval 60 is not throttled", async () => {
    vi.mocked(prisma.appData.findMany).mockResolvedValue([
      {
        userId: "u1",
        user,
        data: { servers: [makeServer({ lastSyncedAt: new Date(Date.now() - 90 * 60_000).toISOString(), syncInterval: 60 })] },
      },
    ] as unknown as File)
    vi.mocked(realImapClient.fetchMessages).mockResolvedValue([])
    await runEmailSync({ respectInterval: true })
    expect(realImapClient.fetchMessages).toHaveBeenCalledTimes(1)
  })

  it("manual sync (no respectInterval) bypasses the interval throttle", async () => {
    vi.mocked(prisma.appData.findMany).mockResolvedValue([
      { userId: "u1", user, data: { servers: [makeServer({ lastSyncedAt: new Date().toISOString(), syncInterval: 6 })] } },
    ] as unknown as File)
    vi.mocked(realImapClient.fetchMessages).mockResolvedValue([])
    await runEmailSync({ userId: "u1" })
    expect(realImapClient.fetchMessages).toHaveBeenCalledTimes(1)
  })
})
