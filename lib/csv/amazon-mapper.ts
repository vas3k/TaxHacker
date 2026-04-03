/**
 * Amazon Business Order Report to Transaction Mapper
 *
 * Converts aggregated Amazon orders into TaxHacker transaction format.
 * Maps order details, items, and business metadata to the transaction schema.
 */

import { TransactionData } from '@/models/transactions'
import { AmazonAggregatedOrder, AmazonOrderItem } from './amazon-aggregator'

/**
 * Map Amazon aggregated order to TransactionData format
 *
 * Critical design decisions:
 * - merchant: "Amazon - {primaryBrand}" (from first item's brand)
 * - description: Concatenated item titles (truncated for readability)
 * - total: paymentAmount (what appears on credit card statement)
 * - issuedAt: paymentDate (when charge posted, not orderDate)
 * - importReference: chargeIdentifier (unique per payment, for exact matching)
 * - items: Array of TransactionData objects (one per item)
 * - extra: Business metadata (orderId, GL Code, Department, etc.)
 *
 * @param order - Aggregated Amazon order
 * @returns Transaction data ready for import
 */
export function mapAmazonOrderToTransaction(
  order: AmazonAggregatedOrder
): Partial<TransactionData> {
  // Determine merchant name from primary brand
  const primaryBrand = order.items.length > 0 && order.items[0].brand
    ? order.items[0].brand
    : null

  const merchantName = primaryBrand
    ? `Amazon - ${primaryBrand}`
    : 'Amazon'

  // Build description from items
  const description = buildDescription(order.items)

  // Build name field (short summary)
  const name = buildName(order.items)

  return {
    // Core transaction fields
    merchant: merchantName,
    name: name,
    description: description,
    total: order.paymentAmount, // CRITICAL: Use payment amount, not sum of items
    currencyCode: 'USD',
    issuedAt: order.paymentDate, // CRITICAL: Use payment date for matching
    importReference: order.paymentReferenceId, // For exact match detection
    type: 'expense',

    // Items array (line items from the order)
    items: order.items.map(item => mapAmazonItemToTransactionData(item)),

    // Extra metadata (business fields, order details)
    extra: {
      // Order identifiers
      orderId: order.orderId,
      paymentReferenceId: order.paymentReferenceId,
      orderDate: order.orderDate.toISOString(),
      invoiceNumber: order.invoiceNumber,
      purchaseOrderNumber: order.purchaseOrderNumber,
      paymentInstrumentType: order.paymentInstrumentType,

      // Business metadata (for accounting integration)
      ...(order.metadata.glCode && { glCode: order.metadata.glCode }),
      ...(order.metadata.department && { department: order.metadata.department }),
      ...(order.metadata.costCenter && { costCenter: order.metadata.costCenter }),
      ...(order.metadata.projectCode && { projectCode: order.metadata.projectCode }),
      ...(order.metadata.location && { location: order.metadata.location }),
      ...(order.metadata.customField1 && { customField1: order.metadata.customField1 }),
      ...(order.metadata.customField2 && { customField2: order.metadata.customField2 }),
      ...(order.metadata.customField3 && { customField3: order.metadata.customField3 }),

      // Summary statistics
      itemCount: order.items.length,
      totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
    }
  }
}

/**
 * Map individual Amazon item to TransactionData format
 * (for the items array in the main transaction)
 */
function mapAmazonItemToTransactionData(item: AmazonOrderItem): TransactionData {
  return {
    name: item.title,
    description: `${item.quantity}x ${item.title}`,
    total: item.netTotal, // Net total for this item (includes tax, shipping, promos)
    currencyCode: 'USD',
    type: 'expense',

    // Item metadata
    extra: {
      asin: item.asin,
      brand: item.brand,
      manufacturer: item.manufacturer,
      quantity: item.quantity,
      subtotal: item.subtotal,
      shipping: item.shipping,
      promotion: item.promotion,
      tax: item.tax,
    }
  }
}

/**
 * Build transaction name (short summary)
 * Examples:
 * - "3 items from Amazon"
 * - "Monoprice Power Cord"
 */
function buildName(items: AmazonOrderItem[]): string {
  if (items.length === 0) {
    return 'Amazon Order'
  }

  if (items.length === 1) {
    // Single item: use the title (truncated)
    return truncate(items[0].title, 60)
  }

  // Multiple items: summary
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  return `${totalItems} item${totalItems !== 1 ? 's' : ''} from Amazon`
}

/**
 * Build transaction description (detailed item list)
 * Examples:
 * - "1x Monoprice Power Cord; 2x USB Cable"
 * - "1x Office Chair; 1x Standing Desk; 1x Monitor Arm; ... and 2 more"
 */
function buildDescription(items: AmazonOrderItem[]): string {
  if (items.length === 0) {
    return 'Amazon order with no items'
  }

  // Show up to 3 items, then "and X more"
  const maxItems = 3
  const itemDescriptions = items.slice(0, maxItems).map(item => {
    const title = truncate(item.title, 50)
    return `${item.quantity}x ${title}`
  })

  if (items.length > maxItems) {
    const remaining = items.length - maxItems
    itemDescriptions.push(`... and ${remaining} more`)
  }

  return itemDescriptions.join('; ')
}

/**
 * Truncate string to max length with ellipsis
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str
  }

  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Format currency amount (cents) to display string
 * Used for debugging/logging
 */
export function formatAmazonAmount(cents: number): string {
  const dollars = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(dollars)
}

/**
 * Get summary information about mapped transaction
 * Used for logging/debugging
 */
export function getTransactionSummary(transaction: Partial<TransactionData>): string {
  const amount = transaction.total ? formatAmazonAmount(transaction.total) : '$0.00'
  const itemCount = transaction.items?.length ?? 0
  const date = transaction.issuedAt
    ? new Date(transaction.issuedAt).toLocaleDateString()
    : 'Unknown date'

  return `${amount} on ${date} - ${itemCount} item${itemCount !== 1 ? 's' : ''}`
}
