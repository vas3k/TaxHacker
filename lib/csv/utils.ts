const currencyKeys = ["total", "amount", "Total", "Amount", "paymentAmount", "Payment Amount"]

/**
 * Try to parse the original CSV amount (stored inside csvData) into major currency units.
 * Returns null when the value cannot be parsed.
 */
export function extractCsvAmountInUnits(csvData: unknown): number | null {
  if (!csvData || typeof csvData !== "object" || Array.isArray(csvData)) {
    return null
  }

  const record = csvData as Record<string, unknown>

  for (const key of currencyKeys) {
    if (!(key in record)) continue
    const parsed = parseCurrencyLikeValue(record[key])
    if (parsed !== null) {
      return parsed
    }
  }

  return null
}

function parseCurrencyLikeValue(value: unknown): number | null {
  if (typeof value === "number") {
    return value
  }

  if (typeof value !== "string") {
    return null
  }

  let normalized = value.trim()
  if (!normalized) {
    return null
  }

  // Remove everything except digits, decimal separators, minus signs
  normalized = normalized.replace(/[^0-9,.\-]/g, "")

  if (!normalized) {
    return null
  }

  // Handle locales that use comma as decimal separator (but no dot)
  if (normalized.includes(",") && !normalized.includes(".")) {
    normalized = normalized.replace(",", ".")
  } else if (normalized.includes(",") && normalized.includes(".")) {
    // Assume comma is thousands separator
    normalized = normalized.replace(/,/g, "")
  }

  const parsed = Number(normalized)
  return Number.isNaN(parsed) ? null : parsed
}
