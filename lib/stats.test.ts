import { describe, expect, it } from "vitest"
import { calcAveragePerPeriod, sumCategoryTotals } from "./stats"

const category = (code: string, income: number, expenses: number) => ({
  code,
  name: code.toUpperCase(),
  color: "#000000",
  income,
  expenses,
  transactionCount: 1,
})

const period = (key: string, income: number, expenses: number, categories: ReturnType<typeof category>[] = []) => ({
  period: key,
  date: new Date(key),
  income,
  expenses,
  categories,
  totalTransactions: categories.length,
})

describe("sumCategoryTotals", () => {
  it("sums one category across periods and sorts by total descending", () => {
    const data = [
      period("2026-01", 0, 300, [category("food", 0, 100), category("rent", 0, 200)]),
      period("2026-02", 0, 250, [category("food", 0, 250)]),
    ]

    expect(sumCategoryTotals(data, "expenses").map((c) => [c.code, c.total])).toEqual([
      ["food", 350],
      ["rent", 200],
    ])
  })

  it("keeps only categories with a positive amount for the requested type", () => {
    const data = [period("2026-01", 500, 100, [category("salary", 500, 0), category("food", 0, 100)])]

    expect(sumCategoryTotals(data, "income").map((c) => c.code)).toEqual(["salary"])
  })
})

describe("calcAveragePerPeriod", () => {
  it("divides by every month between the first and last period, gaps included", () => {
    const data = [period("2025-11", 300, 600), period("2026-01", 300, 0)]

    expect(calcAveragePerPeriod(data)).toEqual({ income: 200, expenses: 200, periods: 3, unit: "month" })
  })

  it("counts days when the series is grouped by day", () => {
    const data = [period("2026-02-27", 0, 40), period("2026-03-02", 0, 40)]

    expect(calcAveragePerPeriod(data)).toEqual({ income: 0, expenses: 20, periods: 4, unit: "day" })
  })

  it("returns null for an empty series", () => {
    expect(calcAveragePerPeriod([])).toBeNull()
  })
})
