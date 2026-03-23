import { parseJsonObject } from "@/lib/db-compat"
import { Field, Transaction } from "@/prisma/client"

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
  const extra = parseJsonObject<Record<string, unknown>>(transaction.extra)

  return requiredFields.filter((field) => {
    const value = field.isExtra
      ? extra?.[field.code]
      : transaction[field.code as keyof Transaction]

    return value === undefined || value === null || value === ""
  })
}
