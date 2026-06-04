import { beforeAll, describe, expect, it, vi } from "vitest"

// --- import-time mocks so importing ./ingest doesn't run config Zod validation or create a Prisma client ---
vi.mock("@/lib/uploads", () => ({ ingestUnsortedFile: vi.fn() }))
vi.mock("@/lib/db", () => ({ prisma: {} }))
vi.mock("@/lib/files", () => ({ getDirectorySize: vi.fn(), getUserUploadsDirectory: vi.fn() }))
vi.mock("@/models/users", () => ({ updateUser: vi.fn() }))
vi.mock("@/lib/email-sync/imap-client", () => ({ realImapClient: { fetchMessages: vi.fn() } }))

const { syncServer } = await import("./ingest")
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
