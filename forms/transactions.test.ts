import { describe, expect, it } from "vitest"
import { transactionFormSchema } from "./transactions"

describe("transactionFormSchema issuedAt", () => {
  it("parses date-only strings as local midnight, not UTC", () => {
    const result = transactionFormSchema.safeParse({ issuedAt: "2024-04-09" })

    expect(result.success).toBe(true)
    if (!result.success) return

    const date = result.data.issuedAt as Date
    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(3) // April
    expect(date.getDate()).toBe(9)
    expect(date.getHours()).toBe(0)
    expect(date.getMinutes()).toBe(0)
  })

  it("does not shift the calendar day behind UTC (e.g. America/New_York)", () => {
    const utcParsed = new Date("2024-04-09")
    // Bare YYYY-MM-DD is UTC midnight — local date can be the previous day west of UTC
    const bareLocalDay = utcParsed.getDate()

    const result = transactionFormSchema.safeParse({ issuedAt: "2024-04-09" })
    expect(result.success).toBe(true)
    if (!result.success) return

    const fixed = result.data.issuedAt as Date
    expect(fixed.getDate()).toBe(9)
    // In timezones behind UTC, the unfixed parse would be day 8
    if (bareLocalDay !== 9) {
      expect(bareLocalDay).toBe(8)
      expect(fixed.getDate()).not.toBe(bareLocalDay)
    }
  })

  it("still accepts full ISO datetime strings", () => {
    const result = transactionFormSchema.safeParse({ issuedAt: "2024-04-09T15:30:00.000Z" })

    expect(result.success).toBe(true)
    if (!result.success) return

    expect((result.data.issuedAt as Date).toISOString()).toBe("2024-04-09T15:30:00.000Z")
  })
})
