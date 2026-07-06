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
  it("uses nested SINCE on first run when initialSince is set", () => {
    expect(buildSearchCriteria({ initialSince: "2026-06-01" })).toEqual([["SINCE", new Date("2026-06-01")]])
  })
  it("uses incremental UID range when a watermark exists (ignores initialSince)", () => {
    expect(buildSearchCriteria({ initialSince: "2026-06-01", lastProcessedUid: 42 })).toEqual([["UID", "43:*"]])
  })
  it("defaults to ALL (entire mailbox) when initialSince is unset or invalid", () => {
    expect(buildSearchCriteria({})).toEqual([["ALL"]])
    expect(buildSearchCriteria({ initialSince: "not-a-date" })).toEqual([["ALL"]])
  })
})
