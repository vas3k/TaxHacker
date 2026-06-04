export function attachmentMatchesExtensions(filename: string, allowedExtensions: string[]): boolean {
  if (!filename) return false
  const lower = filename.toLowerCase()
  return allowedExtensions.some((ext) => {
    const normalized = ext.toLowerCase().startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`
    return lower.endsWith(normalized)
  })
}

export function buildSearchCriteria(server: { addedAt: string; lastProcessedUid?: number }): any[] {
  if (server.lastProcessedUid && server.lastProcessedUid > 0) {
    return [["UID", `${server.lastProcessedUid + 1}:*`]]
  }
  return ["SINCE", new Date(server.addedAt)]
}
