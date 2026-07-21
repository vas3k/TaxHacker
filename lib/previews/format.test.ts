import { describe, expect, it } from "vitest"
import {
  DEFAULT_PREVIEW_FORMAT,
  previewContentType,
  previewExtension,
  resolvePreviewFormat,
} from "./format"

describe("preview format helpers", () => {
  it("resolves known formats and falls back to webp", () => {
    expect(resolvePreviewFormat("png")).toBe("png")
    expect(resolvePreviewFormat("jpeg")).toBe("jpeg")
    expect(resolvePreviewFormat("webp")).toBe("webp")
    expect(resolvePreviewFormat("gif")).toBe(DEFAULT_PREVIEW_FORMAT)
    expect(resolvePreviewFormat(undefined)).toBe(DEFAULT_PREVIEW_FORMAT)
    expect(resolvePreviewFormat("")).toBe(DEFAULT_PREVIEW_FORMAT)
  })

  it("maps formats to content types and file extensions", () => {
    expect(previewContentType("webp")).toBe("image/webp")
    expect(previewContentType("png")).toBe("image/png")
    expect(previewContentType("jpeg")).toBe("image/jpeg")
    expect(previewExtension("webp")).toBe("webp")
    expect(previewExtension("png")).toBe("png")
    expect(previewExtension("jpeg")).toBe("jpg")
  })
})
