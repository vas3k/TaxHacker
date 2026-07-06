import { ImapSearchCriteria } from "./types"

export function attachmentMatchesExtensions(filename: string, allowedExtensions: string[]): boolean {
  if (!filename) return false
  const lower = filename.toLowerCase()
  return allowedExtensions.some((ext) => {
    const normalized = ext.toLowerCase().startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`
    return lower.endsWith(normalized)
  })
}

export function buildSearchCriteria(server: { initialSince?: string; lastProcessedUid?: number }): ImapSearchCriteria[] {
  // Once we have a watermark, only fetch newer messages by UID.
  if (server.lastProcessedUid && server.lastProcessedUid > 0) {
    return [["UID", `${server.lastProcessedUid + 1}:*`]]
  }
  // First run: bound the initial grab by the user-chosen "since" date, if valid.
  if (server.initialSince) {
    const since = new Date(server.initialSince)
    if (!isNaN(since.getTime())) {
      return [["SINCE", since]]
    }
  }
  // Default: no window set → scan the entire mailbox.
  return [["ALL"]]
}
