/**
 * Amazon Business Order Report CSV Aggregator
 *
 * Amazon CSVs have one row per item purchased. This module aggregates
 * multiple rows into single orders by grouping by Order ID + Charge Identifier.
 *
 * Example:
 * - CSV has 65 rows (one per item)
 * - Results in ~10-15 aggregated orders (one per unique order/charge combination)
 */

import { parse } from 'date-fns'

/**
 * Raw row structure from Amazon Business Order Report CSV
 * Note: Amazon uses Excel formula notation for some fields (e.g., ="6674")
 */
export type AmazonRawRow = {
  'Order Date': string
  'Order ID': string
  'Payment Date': string
  'Payment Amount': string
  'Payment Reference ID': string // Amazon's field name for charge identifier
  'Payment Instrument Type': string
  'Invoice Number': string
  'PO Number': string
  'Purchase Order Number': string
  'ASIN': string
  'Title': string
  'Brand': string
  'Manufacturer': string
  'Item Quantity': string
  'Item Subtotal': string
  'Item Shipping & Handling': string
  'Item Promotion': string
  'Item Tax': string
  'Item Net Total': string
  'GL Code': string
  'Department': string
  'Cost Center': string
  'Project Code': string
  'Location': string
  'Custom Field 1': string
  'Custom Field 2': string
  'Custom Field 3': string
}

/**
 * Individual item within an Amazon order
 */
export type AmazonOrderItem = {
  asin: string
  title: string
  brand: string
  manufacturer: string
  quantity: number
  subtotal: number // in cents
  shipping: number // in cents
  promotion: number // in cents (typically negative)
  tax: number // in cents
  netTotal: number // in cents
}

/**
 * Aggregated Amazon order (multiple CSV rows combined into one order)
 */
export type AmazonAggregatedOrder = {
  orderId: string
  paymentReferenceId: string // Amazon's Payment Reference ID (used as unique identifier)
  orderDate: Date
  paymentDate: Date
  paymentAmount: number // in cents - this is what matches credit card statement
  paymentInstrumentType: string
  invoiceNumber?: string
  purchaseOrderNumber?: string
  items: AmazonOrderItem[]
  metadata: {
    glCode?: string
    department?: string
    costCenter?: string
    projectCode?: string
    location?: string
    customField1?: string
    customField2?: string
    customField3?: string
  }
}

/**
 * Clean Excel formula notation from Amazon CSV values
 * Amazon exports some fields with ="value" instead of "value"
 *
 * @example
 * cleanExcelFormula('="6674"') // Returns: "6674"
 * cleanExcelFormula('"6674"') // Returns: "6674"
 * cleanExcelFormula('6674') // Returns: "6674"
 */
function cleanExcelFormula(value: string): string {
  if (!value) return ''

  // Remove Excel formula notation: ="..." → ...
  const cleaned = value.replace(/^="(.+)"$/, '$1')

  // Also handle regular quoted strings
  return cleaned.replace(/^"(.+)"$/, '$1')
}

/**
 * Parse currency string to cents (integer)
 * Handles both regular and Excel formula notation
 *
 * @example
 * parseCurrency('123.45') // Returns: 12345
 * parseCurrency('="123.45"') // Returns: 12345
 * parseCurrency('-50.00') // Returns: -5000
 */
function parseCurrency(value: string): number {
  if (!value) return 0

  let normalized = cleanExcelFormula(value).trim()
  if (!normalized) return 0

  // Treat parentheses and explicit minus signs as negatives
  let sign = 1
  if (/^\(.*\)$/.test(normalized)) {
    sign = -1
    normalized = normalized.slice(1, -1)
  }

  if (normalized.includes("-")) {
    sign *= -1
    normalized = normalized.replace(/-/g, "")
  }

  // Remove currency symbols/letters but keep digits and separators
  normalized = normalized.replace(/[^\d.,]/g, "")
  if (!normalized) return 0

  const lastComma = normalized.lastIndexOf(",")
  const lastDot = normalized.lastIndexOf(".")

  let decimalSeparator: "," | "." | null = null

  if (lastComma !== -1 && lastDot !== -1) {
    decimalSeparator = lastComma > lastDot ? "," : "."
  } else if (lastComma !== -1) {
    const digitsAfterComma = normalized.length - lastComma - 1
    if (digitsAfterComma > 0 && digitsAfterComma <= 2) {
      decimalSeparator = ","
    }
  } else if (lastDot !== -1) {
    const digitsAfterDot = normalized.length - lastDot - 1
    if (digitsAfterDot > 0 && digitsAfterDot <= 2) {
      decimalSeparator = "."
    }
  }

  if (decimalSeparator === ",") {
    normalized = normalized.replace(/\./g, "")
    normalized = normalized.replace(/,/g, ".")
  } else if (decimalSeparator === ".") {
    normalized = normalized.replace(/,/g, "")
  } else {
    normalized = normalized.replace(/[.,]/g, "")
  }

  if (!normalized) return 0

  const num = parseFloat(normalized)

  if (isNaN(num)) return 0

  // Overflow protection: Check bounds before converting to cents
  // Maximum reasonable amount: $100 billion = 10,000,000,000,000 cents
  const MAX_AMOUNT_DOLLARS = 100_000_000_000 // $100 billion
  const MIN_AMOUNT_DOLLARS = -100_000_000_000 // -$100 billion

  if (Math.abs(num) > MAX_AMOUNT_DOLLARS) {
    console.warn(`Currency amount out of bounds: ${value} (parsed as $${num}). Using 0 instead.`)
    return 0
  }

  const cents = Math.round(num * 100) * sign

  // Double check the result is within JavaScript's safe integer range
  if (!Number.isSafeInteger(cents)) {
    console.warn(`Currency conversion produced unsafe integer: ${value} -> ${cents}. Using 0 instead.`)
    return 0
  }

  return cents
}

/**
 * Parse date string in MM/DD/YYYY format
 *
 * @example
 * parseDate('08/02/2024') // Returns: Date object for August 2, 2024
 */
function parseAmazonDate(value: string): Date {
  if (!value) return new Date()

  const cleaned = cleanExcelFormula(value)

  // Try MM/DD/YYYY format (Amazon's standard format)
  const parsed = parse(cleaned, 'MM/dd/yyyy', new Date())

  if (isNaN(parsed.getTime())) {
    console.warn(`Failed to parse Amazon date: "${value}"`)
    return new Date()
  }

  return parsed
}

/**
 * Parse integer from string, handling Excel formula notation
 */
function parseInteger(value: string, defaultValue: number = 0): number {
  if (!value) return defaultValue

  const cleaned = cleanExcelFormula(value)
  const num = parseInt(cleaned, 10)

  return isNaN(num) ? defaultValue : num
}

/**
 * Aggregate Amazon CSV rows by Order ID + Payment Reference ID
 *
 * Amazon CSVs have one row per item. Orders with multiple items will have
 * multiple rows with the same Order ID and Payment Reference ID. This function
 * groups those rows together and creates a single aggregated order with
 * an items array.
 *
 * Key design decisions:
 * - Uses Payment Amount (not sum of items) for the transaction total
 * - Uses Payment Date (not Order Date) for matching against credit card statements
 * - Groups by Order ID + Payment Reference ID composite key (handles split shipments)
 * - Preserves all item-level detail in items array
 * - Extracts business metadata from first row (GL Code, Department, etc.)
 *
 * @param rows - Array of raw Amazon CSV rows
 * @returns Array of aggregated orders
 */
export function aggregateAmazonRows(
  rows: AmazonRawRow[]
): AmazonAggregatedOrder[] {
  // Group rows by Order ID + Payment Reference ID composite key
  const orderMap = new Map<string, AmazonRawRow[]>()

  console.log(`[Amazon Aggregator] Processing ${rows.length} raw rows`)

  for (const row of rows) {
    // Skip rows with missing critical fields
    if (!row['Order ID'] || !row['Payment Reference ID']) {
      console.warn('Skipping row with missing Order ID or Payment Reference ID:', {
        orderId: row['Order ID'],
        paymentRefId: row['Payment Reference ID'],
        availableKeys: Object.keys(row).slice(0, 10)
      })
      continue
    }

    const key = `${row['Order ID']}:${row['Payment Reference ID']}`

    if (!orderMap.has(key)) {
      orderMap.set(key, [])
    }

    orderMap.get(key)!.push(row)
  }

  // Convert grouped rows to aggregated orders
  const orders: AmazonAggregatedOrder[] = []

  for (const [key, rowGroup] of orderMap.entries()) {
    if (rowGroup.length === 0) continue

    // Use first row for order-level fields (same across all rows in group)
    const firstRow = rowGroup[0]

    const order: AmazonAggregatedOrder = {
      orderId: firstRow['Order ID'],
      paymentReferenceId: firstRow['Payment Reference ID'],
      orderDate: parseAmazonDate(firstRow['Order Date']),
      paymentDate: parseAmazonDate(firstRow['Payment Date']),
      paymentAmount: parseCurrency(firstRow['Payment Amount']), // Critical: order total, not item sum
      paymentInstrumentType: firstRow['Payment Instrument Type'] || 'Unknown',
      invoiceNumber: firstRow['Invoice Number']?.trim() || undefined,
      purchaseOrderNumber:
        firstRow['PO Number']?.trim() || firstRow['Purchase Order Number']?.trim() || undefined,
      items: [],
      metadata: {
        glCode: firstRow['GL Code'] || undefined,
        department: firstRow['Department'] || undefined,
        costCenter: firstRow['Cost Center'] || undefined,
        projectCode: firstRow['Project Code'] || undefined,
        location: firstRow['Location'] || undefined,
        customField1: firstRow['Custom Field 1'] || undefined,
        customField2: firstRow['Custom Field 2'] || undefined,
        customField3: firstRow['Custom Field 3'] || undefined,
      }
    }

    // Collect all items from grouped rows
    for (const row of rowGroup) {
      // Skip rows without ASIN (likely not actual items)
      if (!row['ASIN']) {
        console.warn('Skipping item row without ASIN:', row)
        continue
      }

      order.items.push({
        asin: row['ASIN'],
        title: row['Title'] || 'Unknown Item',
        brand: row['Brand'] || '',
        manufacturer: row['Manufacturer'] || '',
        quantity: parseInteger(row['Item Quantity'], 1),
        subtotal: parseCurrency(row['Item Subtotal']),
        shipping: parseCurrency(row['Item Shipping & Handling']),
        promotion: parseCurrency(row['Item Promotion']), // Usually negative
        tax: parseCurrency(row['Item Tax']),
        netTotal: parseCurrency(row['Item Net Total']),
      })
    }

    // Only add orders that have at least one valid item
    if (order.items.length > 0) {
      orders.push(order)
    } else {
      console.warn('Skipping order with no valid items:', key)
    }
  }

  console.log(`[Amazon Aggregator] Result: ${orders.length} aggregated orders from ${rows.length} rows`)
  if (orders.length > 0) {
    console.log('[Amazon Aggregator] First order sample:', {
      orderId: orders[0].orderId,
      paymentReferenceId: orders[0].paymentReferenceId,
      paymentAmount: orders[0].paymentAmount,
      itemCount: orders[0].items.length
    })
  }

  return orders
}

/**
 * Get aggregation statistics for logging/debugging
 */
export function getAggregationStats(
  rows: AmazonRawRow[],
  orders: AmazonAggregatedOrder[]
): {
  totalRows: number
  totalOrders: number
  reductionPercent: number
  avgItemsPerOrder: number
} {
  const totalRows = rows.length
  const totalOrders = orders.length
  const reductionPercent = totalOrders > 0
    ? Math.round(((totalRows - totalOrders) / totalRows) * 100)
    : 0

  const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0)
  const avgItemsPerOrder = totalOrders > 0
    ? Math.round((totalItems / totalOrders) * 10) / 10
    : 0

  return {
    totalRows,
    totalOrders,
    reductionPercent,
    avgItemsPerOrder
  }
}
