import type { DetailedTimeSeriesData } from "@/models/stats"
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
  periods: number
  unit: "month" | "day"
}

export function calcAveragePerPeriod(data: DetailedTimeSeriesData[]): PeriodAverage | null {
  if (!data.length) return null

  const [y1, m1, d1] = data[0].period.split("-").map(Number)
  const [y2, m2, d2] = data[data.length - 1].period.split("-").map(Number)
  const unit = d1 === undefined ? "month" : "day"
  const periods =
    unit === "month"
      ? (y2 - y1) * 12 + (m2 - m1) + 1
      : Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000) + 1

  const sum = (key: "income" | "expenses") => data.reduce((acc, item) => acc + item[key], 0)

  return { income: sum("income") / periods, expenses: sum("expenses") / periods, periods, unit }
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
