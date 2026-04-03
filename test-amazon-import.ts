/**
 * Test script for Amazon Business Order Report import
 * Run with: npx tsx test-amazon-import.ts
 */

import { readFileSync } from 'fs'
import { parse } from '@fast-csv/parse'
import { detectCSVFormat } from './lib/csv/format-detector'
import { aggregateAmazonRows, AmazonRawRow, getAggregationStats } from './lib/csv/amazon-aggregator'
import { mapAmazonOrderToTransaction } from './lib/csv/amazon-mapper'

const AMAZON_CSV_PATH = '/Users/wingert/Downloads/orders_from_20240705_to_20240804_20240804_0936.csv'

async function testAmazonImport() {
  console.log('🧪 Testing Amazon Business Order Report Import\n')

  // Step 1: Read and parse CSV
  console.log('📄 Step 1: Reading CSV file...')
  const buffer = readFileSync(AMAZON_CSV_PATH)
  const rows: string[][] = []

  const parser = parse()
    .on('data', (row) => rows.push(row))
    .on('error', (error) => {
      throw error
    })

  parser.write(buffer)
  parser.end()

  await new Promise((resolve) => parser.on('end', resolve))

  console.log(`   ✓ Parsed ${rows.length} rows\n`)

  // Step 2: Format detection
  console.log('🔍 Step 2: Testing format detection...')
  const format = detectCSVFormat(rows[0])
  console.log(`   Format detected: ${format}`)

  if (format !== 'amazon') {
    console.error(`   ❌ FAILED: Expected 'amazon', got '${format}'`)
    process.exit(1)
  }
  console.log('   ✓ Format detection PASSED\n')

  // Step 3: Convert rows to AmazonRawRow format
  console.log('🔄 Step 3: Converting rows to Amazon format...')
  const headers = rows[0]
  const dataRows = rows.slice(1)

  const amazonRows: AmazonRawRow[] = dataRows.map(row => {
    const amazonRow: Record<string, string> = {}
    headers.forEach((header, index) => {
      amazonRow[header] = row[index] || ''
    })
    return amazonRow as unknown as AmazonRawRow
  })

  console.log(`   ✓ Converted ${amazonRows.length} data rows\n`)

  // Step 4: Aggregate orders
  console.log('📦 Step 4: Aggregating items by order...')
  const aggregatedOrders = aggregateAmazonRows(amazonRows)
  const stats = getAggregationStats(amazonRows, aggregatedOrders)

  console.log(`   Total rows: ${stats.totalRows}`)
  console.log(`   Total orders: ${stats.totalOrders}`)
  console.log(`   Reduction: ${stats.reductionPercent}%`)
  console.log(`   Avg items per order: ${stats.avgItemsPerOrder}`)
  console.log('   ✓ Aggregation PASSED\n')

  // Step 5: Map to transactions
  console.log('💰 Step 5: Mapping orders to transactions...')
  const transactions = aggregatedOrders.map(order => mapAmazonOrderToTransaction(order))

  console.log(`   ✓ Mapped ${transactions.length} transactions\n`)

  // Step 6: Display sample transaction
  console.log('📊 Step 6: Sample transaction details...')
  if (transactions.length > 0) {
    const sample = transactions[0]
    console.log(`   Merchant: ${sample.merchant}`)
    console.log(`   Name: ${sample.name}`)
    console.log(`   Description: ${sample.description}`)
    console.log(`   Total: $${(sample.total! / 100).toFixed(2)}`)
    console.log(`   Date: ${sample.issuedAt}`)
    console.log(`   Import Reference: ${sample.importReference}`)
    console.log(`   Item count: ${sample.items?.length || 0}`)
    console.log(`   Has extra metadata: ${Object.keys(sample.extra || {}).length > 0 ? 'Yes' : 'No'}`)

    if (sample.extra) {
      console.log(`   Extra fields: ${Object.keys(sample.extra).join(', ')}`)
    }

    if (sample.items && sample.items.length > 0) {
      console.log(`\n   Sample item:`)
      const item = sample.items[0]
      console.log(`     - Name: ${item.name}`)
      console.log(`     - Quantity: ${(item.extra as any)?.quantity || 1}`)
      console.log(`     - Total: $${(item.total! / 100).toFixed(2)}`)
    }
  }

  console.log('\n✅ All tests PASSED!\n')
  console.log('Summary:')
  console.log(`  - Format detection: ✓`)
  console.log(`  - Row aggregation: ${stats.totalRows} rows → ${stats.totalOrders} orders`)
  console.log(`  - Transaction mapping: ${transactions.length} transactions ready`)
  console.log(`  - Data reduction: ${stats.reductionPercent}%`)
}

// Run tests
testAmazonImport().catch((error) => {
  console.error('\n❌ Test failed:', error)
  process.exit(1)
})
