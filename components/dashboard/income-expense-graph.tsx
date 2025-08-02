"use client"

import { formatCurrency, formatPeriodLabel } from "@/lib/utils"
import { DetailedTimeSeriesData } from "@/models/stats"
import { addDays, endOfMonth, format, startOfMonth } from "date-fns"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { IncomeExpenceGraphTooltip } from "./income-expense-graph-tooltip"

interface IncomeExpenseGraphProps {
  data: DetailedTimeSeriesData[]
  defaultCurrency: string
}

export function IncomeExpenseGraph({ data, defaultCurrency }: IncomeExpenseGraphProps) {
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{
    data: DetailedTimeSeriesData | null
    position: { x: number; y: number }
    visible: boolean
  }>({
    data: null,
    position: { x: 0, y: 0 },
    visible: false,
  })

  // Auto-scroll to the right to show latest data
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth
    }
  }, [data])

  const handleBarHover = (item: DetailedTimeSeriesData, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const containerRect = scrollContainerRef.current?.getBoundingClientRect()

    setTooltip({
      data: item,
      position: {
        x: rect.left + rect.width / 2,
        y: containerRect ? containerRect.top + containerRect.height / 2 : rect.top,
      },
      visible: true,
    })
  }

  const handleBarLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }

  const handleBarClick = (item: DetailedTimeSeriesData, type: "income" | "expense") => {
    // Calculate date range for the period
    const isDailyPeriod = item.period.includes("-") && item.period.split("-").length === 3

    let dateFrom: string
    let dateTo: string

    if (isDailyPeriod) {
      // Daily period: use the exact date, add 1 day to dateTo
      const date = new Date(item.period)
      dateFrom = item.period // YYYY-MM-DD format
      dateTo = format(addDays(date, 1), "yyyy-MM-dd")
    } else {
      // Monthly period: use first and last day of the month, add 1 day to dateTo
      const [year, month] = item.period.split("-")
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1)

      dateFrom = format(startOfMonth(monthDate), "yyyy-MM-dd")
      dateTo = format(addDays(endOfMonth(monthDate), 1), "yyyy-MM-dd")
    }

    // Build URL parameters
    const params = new URLSearchParams({
      type,
      dateFrom,
      dateTo,
    })

    // Navigate to transactions page with filters
    router.push(`/transactions?${params.toString()}`)
  }

  if (!data.length) {
    return (
      <div className="w-full h-96 flex items-center justify-center text-muted-foreground">
        No data available for the selected period
      </div>
    )
  }

  const maxIncome = Math.max(...data.map((d) => d.income))
  const maxExpense = Math.max(...data.map((d) => d.expenses))
  const maxValue = Math.max(maxIncome, maxExpense)

  if (maxValue === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center text-muted-foreground">
        No transactions found for the selected period
      </div>
    )
  }

  return (
    <div className="w-full h-[400px]">
      {/* Chart container with horizontal scroll */}
      <div ref={scrollContainerRef} className="relative h-full overflow-x-auto">
        <div className="h-full flex flex-col" style={{ minWidth: `${Math.max(600, data.length * 94)}px` }}>
          {/* Income section (top half) */}
          <div className="h-1/2 flex justify-center gap-1 px-2">
            {data.map((item, index) => {
              const incomeHeight = maxValue > 0 ? (item.income / maxValue) * 100 : 0

              return (
                <div
                  key={`income-${item.period}`}
                  className="flex-1 min-w-[90px] h-full flex flex-col justify-end items-center cursor-pointer"
                  onMouseEnter={(e) => handleBarHover(item, e)}
                  onMouseLeave={handleBarLeave}
                  onClick={() => item.income > 0 && handleBarClick(item, "income")}
                >
                  {/* Period label above income bars */}
                  <div className="text-sm font-bold text-gray-700 break-all mb-2 text-center">
                    {formatPeriodLabel(item.period, item.date)}
                  </div>

                  {item.income > 0 && (
                    <>
                      {/* Income amount label */}
                      <div className="text-xs font-semibold text-green-600 mb-1 break-all text-center">
                        {formatCurrency(item.income, defaultCurrency)}
                      </div>
                      {/* Income bar growing upward from bottom */}
                      <div
                        className="w-full bg-gradient-to-t from-green-500 via-green-400 to-emerald-300 border border-green-500/50 rounded-t-lg shadow-sm hover:shadow-md transition-shadow duration-200 min-w-full"
                        style={{ height: `${incomeHeight}%` }}
                      />
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* X-axis line (center) */}
          <div className="w-full border-t-2 border-gray-600" />

          {/* Expense section (bottom half) */}
          <div className="h-1/2 flex justify-center gap-1 px-2">
            {data.map((item, index) => {
              const expenseHeight = maxValue > 0 ? (item.expenses / maxValue) * 100 : 0

              return (
                <div
                  key={`expense-${item.period}`}
                  className="flex-1 min-w-[90px] h-full flex flex-col justify-start items-center cursor-pointer"
                  onMouseEnter={(e) => handleBarHover(item, e)}
                  onMouseLeave={handleBarLeave}
                  onClick={() => item.expenses > 0 && handleBarClick(item, "expense")}
                >
                  {item.expenses > 0 && (
                    <>
                      {/* Expense bar growing downward from top */}
                      <div
                        className="w-full bg-gradient-to-b from-red-500 via-red-400 to-rose-300 border border-red-500/50 rounded-b-lg shadow-sm hover:shadow-md transition-shadow duration-200 min-w-full"
                        style={{ height: `${expenseHeight}%` }}
                      />
                      {/* Expense amount label */}
                      <div className="text-xs font-semibold text-red-600 mt-1 break-all text-center">
                        {formatCurrency(item.expenses, defaultCurrency)}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <IncomeExpenceGraphTooltip
        data={tooltip.data}
        defaultCurrency={defaultCurrency}
        position={tooltip.position}
        visible={tooltip.visible}
      />
    </div>
  )
}
