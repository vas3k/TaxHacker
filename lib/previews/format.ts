export const PREVIEW_FORMATS = ["webp", "png", "jpeg"] as const

export type PreviewFormat = (typeof PREVIEW_FORMATS)[number]

export const DEFAULT_PREVIEW_FORMAT: PreviewFormat = "webp"

export function resolvePreviewFormat(value?: string | null): PreviewFormat {
  if (value === "png" || value === "jpeg" || value === "webp") {
    return value
  }
  return DEFAULT_PREVIEW_FORMAT
}

export function previewContentType(format: PreviewFormat): string {
  return format === "jpeg" ? "image/jpeg" : `image/${format}`
}

/** File extension used for cached preview files (jpeg → jpg for GraphicsMagick). */
export function previewExtension(format: PreviewFormat): string {
  return format === "jpeg" ? "jpg" : format
}
