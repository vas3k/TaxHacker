/**
 * Database compatibility layer for PostgreSQL vs SQLite
 *
 * PostgreSQL uses native JSON types, SQLite stores JSON as strings.
 * This module provides utilities to handle these differences.
 */

// Check if using SQLite (stores JSON as string) vs PostgreSQL (native JSON)
export const isSQLite = process.env.DATABASE_PROVIDER === "sqlite" ||
  process.env.DATABASE_URL?.startsWith("file:")

/**
 * Parse a JSON field value from the database
 * PostgreSQL returns parsed objects, SQLite returns strings
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
 * Prepare a JSON value for storage
 * PostgreSQL accepts objects directly, SQLite needs strings
 */
export function prepareJsonField<T>(value: T): T | string {
  if (isSQLite) {
    return JSON.stringify(value)
  }
  return value
}

/**
 * Get case-insensitive search filter
 * PostgreSQL supports mode: 'insensitive', SQLite uses LOWER()
 */
export function getCaseInsensitiveContains(field: string, search: string) {
  if (isSQLite) {
    // SQLite: Use case-insensitive LIKE via raw query or simple contains
    // Note: SQLite's LIKE is case-insensitive for ASCII by default
    return { [field]: { contains: search } }
  }
  return { [field]: { contains: search, mode: "insensitive" as const } }
}

/**
 * Build case-insensitive search filters for multiple fields
 */
export function buildSearchFilters(fields: string[], search: string) {
  return fields.map(field => getCaseInsensitiveContains(field, search))
}

/**
 * Parse files array from transaction (handles both JSON and string storage)
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
