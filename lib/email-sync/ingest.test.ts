import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

// --- import-time mocks so importing ./ingest doesn't run config Zod validation or create a Prisma client ---
vi.mock("@/lib/uploads", () => ({ ingestUnsortedFile: vi.fn() }))
vi.mock("@/lib/db", () => {
  // applyResult now locks + re-reads inside a transaction; provide a tx with $queryRaw + update.
  const tx = { $queryRaw: vi.fn(async () => [{ data: { servers: [] } }]), appData: { update: vi.fn() } }
  return {
    prisma: { appData: { findMany: vi.fn() }, $transaction: vi.fn(async (fn: any) => fn(tx)) },
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
import { ImapClient, ImapMessage } from "./types"

beforeAll(() => {
  process.env.BETTER_AUTH_SECRET = "test-secret-key-for-encryption-unit-tests"
})

const user = { id: "user-1", email: "u@example.com", storageUsed: 0, storageLimit: -1 } as any

function makeServer(overrides: any = {}) {
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
    const ingested: any[] = []
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
      ingest: async (_u, input) => { ingested.push(input); return { id: "f", ...input } as any },
    })

    expect(ingested.map((i) => i.filename)).toEqual(["invoice.pdf", "receipt.pdf"])
    expect(result.processed).toBe(2)
    expect(result.lastProcessedUid).toBe(12)
    expect(result.status).toBe("connected")
  })

  it("does not advance the watermark when there are no new messages", async () => {
    const result = await syncServer(makeServer({ lastProcessedUid: 5 }), user, {
      client: fakeClient([]), ingest: async () => ({}) as any,
    })
    expect(result.processed).toBe(0)
    expect(result.lastProcessedUid).toBe(5)
    expect(result.status).toBe("connected")
  })

  it("skips messages at or below the watermark (defends against the IMAP `UID n:*` re-fetch quirk)", async () => {
    const ingested: any[] = []
    // Some servers (Gmail/Dovecot) return the highest existing UID for `UID (last+1):*`
    // when there is no newer mail — re-delivering the watermark message.
    const result = await syncServer(makeServer({ lastProcessedUid: 603 }), user, {
      client: fakeClient([
        { uid: 603, attachments: [{ filename: "dup.pdf", contentType: "application/pdf", content: Buffer.from("x"), size: 1 }] },
      ]),
      ingest: async (_u, input) => { ingested.push(input); return { id: "f" } as any },
    })
    expect(ingested).toHaveLength(0)
    expect(result.processed).toBe(0)
    expect(result.lastProcessedUid).toBe(603)
  })

  it("returns a friendly error when the stored password cannot be decrypted", async () => {
    const result = await syncServer(makeServer({ password: "v1:bad:bad:bad", lastProcessedUid: 9 }), user, {
      client: fakeClient([]),
      ingest: async () => ({}) as any,
    })
    expect(result.status).toBe("error")
    expect(result.errorMessage).toMatch(/could not be decrypted/i)
    expect(result.lastProcessedUid).toBe(9)
  })

  it("reports error status and keeps the old watermark on client failure", async () => {
    const result = await syncServer(makeServer({ lastProcessedUid: 7 }), user, {
      client: { fetchMessages: vi.fn(async () => { throw new Error("auth failed") }) },
      ingest: async () => ({}) as any,
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
    ] as any)
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
    vi.mocked(ingestUnsortedFile).mockResolvedValue({ id: "f" } as any)
    vi.mocked(getDirectorySize).mockResolvedValue(123)
    await runEmailSync()
    expect(getDirectorySize).toHaveBeenCalledTimes(1)
  })

  it("cron run (respectInterval) skips a server still within its syncInterval", async () => {
    vi.mocked(prisma.appData.findMany).mockResolvedValue([
      { userId: "u1", user, data: { servers: [makeServer({ lastSyncedAt: new Date().toISOString(), syncInterval: 6 })] } },
    ] as any)
    const results = await runEmailSync({ respectInterval: true })
    expect(realImapClient.fetchMessages).not.toHaveBeenCalled()
    expect(results).toHaveLength(0)
  })

  it("manual sync (no respectInterval) bypasses the interval throttle", async () => {
    vi.mocked(prisma.appData.findMany).mockResolvedValue([
      { userId: "u1", user, data: { servers: [makeServer({ lastSyncedAt: new Date().toISOString(), syncInterval: 6 })] } },
    ] as any)
    vi.mocked(realImapClient.fetchMessages).mockResolvedValue([])
    await runEmailSync({ userId: "u1" })
    expect(realImapClient.fetchMessages).toHaveBeenCalledTimes(1)
  })
})
