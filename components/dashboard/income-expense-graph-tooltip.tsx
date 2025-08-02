import { formatCurrency, formatPeriodLabel } from "@/lib/utils"
import { DetailedTimeSeriesData } from "@/models/stats"

interface ChartTooltipProps {
  data: DetailedTimeSeriesData | null
  defaultCurrency: string
  position: { x: number; y: number }
  visible: boolean
  containerWidth?: number
}

export function IncomeExpenceGraphTooltip({ data, defaultCurrency, position, visible }: ChartTooltipProps) {
  if (!visible || !data) {
    return null
  }

  const incomeCategories = data.categories.filter((cat) => cat.income > 0)
  const expenseCategories = data.categories.filter((cat) => cat.expenses > 0)

  const tooltipWidth = 320 // estimated max width
  const spaceToRight = window.innerWidth - position.x
  const showToRight = spaceToRight >= tooltipWidth + 20 // 20px margin

  const horizontalOffset = showToRight ? 15 : -15 // distance from cursor
  const horizontalTransform = showToRight ? "0%" : "-100%"

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs pointer-events-none"
      style={{
        left: `${position.x + horizontalOffset}px`,
        top: `${position.y}px`,
        transform: `translate(${horizontalTransform}, -50%)`, // Center vertically, adjust horizontally
        width: "320px",
      }}
    >
      {/* Header */}
      <div className="mb-3 pb-2 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-sm">{formatPeriodLabel(data.period, data.date)}</h3>
        <p className="text-xs text-gray-500">
          {data.totalTransactions} transaction{data.totalTransactions !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Totals */}
      <div className="mb-3 space-y-1">
        {data.income > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-600">Total Income:</span>
            <span className="text-sm font-bold text-green-600">{formatCurrency(data.income, defaultCurrency)}</span>
          </div>
        )}
        {data.expenses > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-red-600">Total Expenses:</span>
            <span className="text-sm font-bold text-red-600">{formatCurrency(data.expenses, defaultCurrency)}</span>
          </div>
        )}
      </div>

      {/* Income Categories */}
      {incomeCategories.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-green-600 mb-2 uppercase tracking-wide">Income by Category</h4>
          <div className="space-y-1">
            {incomeCategories.map((category) => (
              <div key={`income-${category.code}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                  <span className="text-xs text-gray-700 truncate">{category.name}</span>
                </div>
                <span className="text-xs font-medium text-green-600 ml-2">
                  {formatCurrency(category.income, defaultCurrency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense Categories */}
      {expenseCategories.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-red-600 mb-2 uppercase tracking-wide">Expenses by Category</h4>
          <div className="space-y-1">
            {expenseCategories.map((category) => (
              <div key={`expense-${category.code}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                  <span className="text-xs text-gray-700 truncate">{category.name}</span>
                </div>
                <span className="text-xs font-medium text-red-600 ml-2">
                  {formatCurrency(category.expenses, defaultCurrency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
