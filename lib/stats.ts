import { Transaction } from "@prisma/client"

export function calcTotalPerCurrency(transactions: Transaction[]): Record<string, number> {
  return transactions.reduce((acc, transaction) => {
    if (transaction.convertedCurrencyCode) {
      acc[transaction.convertedCurrencyCode] =
        (acc[transaction.convertedCurrencyCode] || 0) + (transaction.convertedTotal || 0)
    } else if (transaction.currencyCode) {
      acc[transaction.currencyCode] = (acc[transaction.currencyCode] || 0) + (transaction.total || 0)
    }
    return acc
  }, {} as Record<string, number>)
}
