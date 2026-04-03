"use client"

import { formatDate } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { formatCurrency, formatCurrencyUnits } from "@/lib/utils"
import { extractCsvAmountInUnits } from "@/lib/csv/utils"
import { ArrowRight, Check, AlertCircle, Package } from "lucide-react"

type TransactionMatch = {
  id: string
  transactionId: string
  confidence: number
  matchedAmount: number
  matchedDate: Date
  existingDate: Date
  daysDifference: number
  status: string
  csvData: unknown
  mergedFields: unknown
  reviewedBy: string | null
  reviewedAt: Date | null
  createdAt: Date
  transaction: {
    id: string
    name: string | null
    description: string | null
    merchant: string | null
    total: number | null
    currencyCode: string | null
    convertedCurrencyCode: string | null
    issuedAt: Date | null
    projectCode: string | null
    categoryCode: string | null
    createdAt: Date
    updatedAt: Date
  }
}

type MatchDetailComparisonProps = {
  match: TransactionMatch
}

export function MatchDetailComparison({ match }: MatchDetailComparisonProps) {
  const csvData = match.csvData as Record<string, unknown> | null
  const mergedFields = Array.isArray(match.mergedFields) ? (match.mergedFields as string[]) : []
  const transaction = match.transaction

  // Extract Amazon-specific data
  const isAmazonImport = csvData && ('orderId' in csvData || 'Order ID' in csvData)
  const amazonItems = csvData && 'items' in csvData ? (csvData.items as any[]) : []

  // Currency for display
  const currency = transaction.currencyCode ?? transaction.convertedCurrencyCode ?? "USD"

  // Get CSV amount
  const csvAmount = csvData ? extractCsvAmountInUnits(csvData) : null

  // Field comparison helper
  const ComparisonRow = ({
    label,
    csvValue,
    transactionValue,
    isMerged = false
  }: {
    label: string
    csvValue: React.ReactNode
    transactionValue: React.ReactNode
    isMerged?: boolean
  }) => {
    const isDifferent = String(csvValue) !== String(transactionValue)

    return (
      <div className={`grid grid-cols-[1fr_auto_1fr] gap-4 py-3 border-b ${isMerged ? 'bg-green-50' : ''}`}>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
          <div className={`text-sm ${isDifferent ? 'font-semibold text-blue-600' : ''}`}>
            {csvValue || <span className="text-muted-foreground italic">-</span>}
          </div>
        </div>
        <div className="flex items-center">
          {isMerged ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : isDifferent ? (
            <ArrowRight className="h-4 w-4 text-blue-600" />
          ) : (
            <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
          )}
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Transaction</div>
          <div className={`text-sm ${isMerged ? 'font-semibold text-green-600' : ''}`}>
            {transactionValue || <span className="text-muted-foreground italic">-</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Match Info Summary */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Confidence:</span>
            <Badge className="ml-2 bg-blue-600">{match.confidence}%</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span>
            <span className="ml-2 font-medium capitalize">{match.status.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Date Difference:</span>
            <span className="ml-2 font-medium">{match.daysDifference} days</span>
          </div>
          <div>
            <span className="text-muted-foreground">Matched:</span>
            <span className="ml-2 font-medium">{formatDate(match.createdAt, "PPp")}</span>
          </div>
        </div>
      </Card>

      {/* Merged Fields Alert */}
      {mergedFields.length > 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Fields Merged from CSV</h4>
              <p className="text-sm text-green-700 mt-1">
                The following fields were updated from the imported CSV data:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {mergedFields.map((field) => (
                  <Badge key={field} className="bg-green-600">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Field Comparison */}
      <div>
        <h4 className="font-semibold mb-3 text-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Field Comparison
        </h4>
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 p-4 bg-muted/50 border-b font-semibold text-sm">
            <div>CSV Data</div>
            <div></div>
            <div>Existing Transaction</div>
          </div>

          <div className="divide-y">
            <ComparisonRow
              label="Name / Description"
              csvValue={String(csvData?.name || csvData?.description || '')}
              transactionValue={transaction.name || transaction.description}
              isMerged={mergedFields.includes('name') || mergedFields.includes('description')}
            />

            <ComparisonRow
              label="Merchant"
              csvValue={csvData?.merchant ? String(csvData.merchant) : ''}
              transactionValue={transaction.merchant}
              isMerged={mergedFields.includes('merchant')}
            />

            <ComparisonRow
              label="Amount"
              csvValue={csvAmount !== null ? formatCurrencyUnits(csvAmount, currency) : String(match.matchedAmount)}
              transactionValue={transaction.total ? formatCurrency(transaction.total, currency) : null}
              isMerged={mergedFields.includes('total')}
            />

            <ComparisonRow
              label="Date"
              csvValue={formatDate(match.matchedDate, "yyyy-MM-dd")}
              transactionValue={transaction.issuedAt ? formatDate(transaction.issuedAt, "yyyy-MM-dd") : null}
              isMerged={mergedFields.includes('issuedAt')}
            />

            <ComparisonRow
              label="Project"
              csvValue={csvData?.projectCode ? String(csvData.projectCode) : (csvData && 'PO Number' in csvData ? String(csvData['PO Number']) : '')}
              transactionValue={transaction.projectCode}
              isMerged={mergedFields.includes('projectCode')}
            />

            {csvData && Object.entries(csvData)
              .filter(([key]) => !['name', 'description', 'merchant', 'total', 'issuedAt', 'projectCode', 'items'].includes(key))
              .slice(0, 5)
              .map(([key, value]) => (
                <ComparisonRow
                  key={key}
                  label={key}
                  csvValue={String(value)}
                  transactionValue={null}
                />
              ))}
          </div>
        </Card>
      </div>

      {/* Amazon Order Items */}
      {isAmazonImport && amazonItems.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Amazon Order Items ({amazonItems.length})
          </h4>
          <Card className="p-4">
            <div className="space-y-3">
              {amazonItems.map((item: any, index: number) => (
                <div key={index} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-shrink-0 font-semibold text-muted-foreground">
                    {item.quantity || 1}x
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-medium text-sm">
                      {item.title || item.name || 'Item ' + (index + 1)}
                    </div>
                    {item.asin && (
                      <div className="text-xs text-muted-foreground">
                        ASIN: {item.asin}
                      </div>
                    )}
                    {item.category && (
                      <div className="text-xs">
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>
                    )}
                  </div>
                  {item.itemTotal && (
                    <div className="flex-shrink-0 font-semibold">
                      {formatCurrency(item.itemTotal, currency)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Raw Data (collapsed by default) */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
          View Raw Data
        </summary>
        <div className="mt-3 space-y-3">
          <Card className="p-4">
            <h5 className="font-medium mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              CSV Data
            </h5>
            <pre className="text-xs bg-muted/50 p-3 rounded overflow-auto max-h-[300px]">
              {JSON.stringify(csvData, null, 2)}
            </pre>
          </Card>
          <Card className="p-4">
            <h5 className="font-medium mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Transaction Data
            </h5>
            <pre className="text-xs bg-muted/50 p-3 rounded overflow-auto max-h-[300px]">
              {JSON.stringify(transaction, null, 2)}
            </pre>
          </Card>
        </div>
      </details>
    </div>
  )
}
