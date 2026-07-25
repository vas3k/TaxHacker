import { describe, expect, it } from "vitest"
import { transactionFormSchema } from "./transactions"

describe("transactionFormSchema issuedAt", () => {
  it("parses date-only strings as UTC midnight", () => {
    const result = transactionFormSchema.safeParse({ issuedAt: "2024-04-09" })

    expect(result.success).toBe(true)
    if (!result.success) return

    const date = result.data.issuedAt as Date
    expect(date.toISOString()).toBe("2024-04-09T00:00:00.000Z")
    expect(date.getUTCFullYear()).toBe(2024)
    expect(date.getUTCMonth()).toBe(3) // April
    expect(date.getUTCDate()).toBe(9)
    expect(date.getUTCHours()).toBe(0)
    expect(date.getUTCMinutes()).toBe(0)
  })

  it("keeps the calendar day in UTC regardless of local timezone", () => {
    const result = transactionFormSchema.safeParse({ issuedAt: "2024-04-09" })
    expect(result.success).toBe(true)
    if (!result.success) return

    const fixed = result.data.issuedAt as Date
    expect(fixed.getUTCDate()).toBe(9)
    expect(fixed.toISOString().startsWith("2024-04-09")).toBe(true)
  })

  it("still accepts full ISO datetime strings", () => {
    const result = transactionFormSchema.safeParse({ issuedAt: "2024-04-09T15:30:00.000Z" })

    expect(result.success).toBe(true)
    if (!result.success) return

    expect((result.data.issuedAt as Date).toISOString()).toBe("2024-04-09T15:30:00.000Z")
  })
})
