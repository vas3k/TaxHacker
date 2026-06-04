import { describe, expect, it } from "vitest"
import { attachmentMatchesExtensions, buildSearchCriteria } from "./filters"

describe("attachmentMatchesExtensions", () => {
  const exts = [".pdf", ".JPG", "png"]
  it("matches case-insensitively, with or without leading dot", () => {
    expect(attachmentMatchesExtensions("Invoice.PDF", exts)).toBe(true)
    expect(attachmentMatchesExtensions("scan.jpg", exts)).toBe(true)
    expect(attachmentMatchesExtensions("photo.png", exts)).toBe(true)
  })
  it("rejects non-matching or extensionless names", () => {
    expect(attachmentMatchesExtensions("notes.txt", exts)).toBe(false)
    expect(attachmentMatchesExtensions("noext", exts)).toBe(false)
    expect(attachmentMatchesExtensions("", exts)).toBe(false)
  })
})

describe("buildSearchCriteria", () => {
  it("uses SINCE addedAt on first run (no lastProcessedUid)", () => {
    const c = buildSearchCriteria({ addedAt: "2026-06-01T00:00:00.000Z" })
    expect(c[0]).toBe("SINCE")
    expect(c[1]).toBeInstanceOf(Date)
  })
  it("uses incremental UID range when a watermark exists", () => {
    expect(buildSearchCriteria({ addedAt: "2026-06-01T00:00:00.000Z", lastProcessedUid: 42 })).toEqual([
      ["UID", "43:*"],
    ])
  })
})
