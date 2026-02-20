/**
 * Database compatibility utilities for JSON field handling
 *
 * Provides type-safe parsing for JSON fields stored in PostgreSQL.
 */

/**
 * Parse a JSON field value from the database
 */
export function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (value === null || value === undefined) {
    return defaultValue
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T
    } catch {
      return defaultValue
    }
  }

  return value as T
}

/**
 * Get case-insensitive search filter
 */
export function getCaseInsensitiveContains(field: string, search: string) {
  return { [field]: { contains: search, mode: "insensitive" as const } }
}

/**
 * Build case-insensitive search filters for multiple fields
 */
export function buildSearchFilters(fields: string[], search: string) {
  return fields.map(field => getCaseInsensitiveContains(field, search))
}

/**
 * Parse files array from transaction
 */
export function parseFilesArray(files: unknown): string[] {
  return parseJsonField<string[]>(files, [])
}

/**
 * Parse items array from transaction
 */
export function parseItemsArray<T>(items: unknown): T[] {
  return parseJsonField<T[]>(items, [])
}

/**
 * Parse extra/metadata object from database
 */
export function parseJsonObject<T extends Record<string, unknown>>(value: unknown): T | null {
  if (value === null || value === undefined) {
    return null
  }
  return parseJsonField<T>(value, {} as T)
}
