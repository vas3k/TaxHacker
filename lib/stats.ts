import { isDailyPeriod } from "@/lib/utils"
import type { DetailedTimeSeriesData } from "@/models/stats"
import type { TransactionFilters } from "@/models/transactions"
import { Field, Transaction } from "@/prisma/client"

export type CategoryTotal = {
  code: string
  name: string
  color: string
  total: number
}

export function sumCategoryTotals(data: DetailedTimeSeriesData[], type: "income" | "expenses"): CategoryTotal[] {
  const totals = new Map<string, CategoryTotal>()

  for (const { categories } of data) {
    for (const { code, name, color, [type]: amount } of categories) {
      if (amount <= 0) continue
      const entry = totals.get(code) ?? { code, name, color, total: 0 }
      entry.total += amount
      totals.set(code, entry)
    }
  }

  return [...totals.values()].sort((a, b) => b.total - a.total)
}

export type PeriodAverage = {
  income: number
  expenses: number
  periodCount: number
  unit: "month" | "day"
}

export function calcAveragePerPeriod(
  data: DetailedTimeSeriesData[],
  { dateFrom, dateTo }: Pick<TransactionFilters, "dateFrom" | "dateTo"> = {}
): PeriodAverage | null {
  if (!data.length) return null

  const first = data[0].period
  const last = data[data.length - 1].period
  const unit = isDailyPeriod(first) ? "day" : "month"
  const from = dateFrom && dateTo ? dateFrom : unit === "day" ? first : `${first}-01`
  const to = dateFrom && dateTo ? dateTo : unit === "day" ? last : `${last}-${lastDayOfMonth(last)}`
  const periodCount = countPeriods(from, to, unit)

  const sum = (key: "income" | "expenses") => data.reduce((acc, item) => acc + item[key], 0)

  return { income: sum("income") / periodCount, expenses: sum("expenses") / periodCount, periodCount, unit }
}

function lastDayOfMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split("-").map(Number)
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function countPeriods(from: string, to: string, unit: PeriodAverage["unit"]): number {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number)
  const [toYear, toMonth, toDay] = to.split("-").map(Number)

  if (unit === "day") {
    return (
      Math.round((Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86_400_000) + 1
    )
  }

  return Math.max(1, (toYear - fromYear) * 12 + (toMonth - fromMonth) + (toDay > fromDay ? 1 : 0))
}

export function calcTotalPerCurrency(transactions: Transaction[]): Record<string, number> {
  return transactions.reduce(
    (acc, transaction) => {
      if (transaction.convertedCurrencyCode) {
        acc[transaction.convertedCurrencyCode.toUpperCase()] =
          (acc[transaction.convertedCurrencyCode.toUpperCase()] || 0) + (transaction.convertedTotal || 0)
      } else if (transaction.currencyCode) {
        acc[transaction.currencyCode.toUpperCase()] =
          (acc[transaction.currencyCode.toUpperCase()] || 0) + (transaction.total || 0)
      }
      return acc
    },
    {} as Record<string, number>
  )
}

export function calcNetTotalPerCurrency(transactions: Transaction[]): Record<string, number> {
  return transactions.reduce(
    (acc, transaction) => {
      let amount = 0
      let currency: string | undefined
      if (
        transaction.convertedTotal !== null &&
        transaction.convertedTotal !== undefined &&
        transaction.convertedCurrencyCode
      ) {
        amount = transaction.convertedTotal
        currency = transaction.convertedCurrencyCode.toUpperCase()
      } else if (transaction.total !== null && transaction.total !== undefined && transaction.currencyCode) {
        amount = transaction.total
        currency = transaction.currencyCode.toUpperCase()
      }
      if (currency && amount !== 0) {
        const sign = transaction.type === "expense" ? -1 : 1
        acc[currency] = (acc[currency] || 0) + amount * sign
      }
      return acc
    },
    {} as Record<string, number>
  )
}

export const isTransactionIncomplete = (fields: Field[], transaction: Transaction): boolean => {
  const incompleteFields = incompleteTransactionFields(fields, transaction)

  return incompleteFields.length > 0
}

export const incompleteTransactionFields = (fields: Field[], transaction: Transaction): Field[] => {
  const requiredFields = fields.filter((field) => field.isRequired)

  return requiredFields.filter((field) => {
    const value = field.isExtra
      ? (transaction.extra as Record<string, unknown>)?.[field.code]
      : transaction[field.code as keyof Transaction]

    return value === undefined || value === null || value === ""
  })
}
