import { Transaction } from "@/prisma/client"

export type ActionState<T> = {
  success: boolean
  error?: string | null
  data?: T | null
  duplicateData?: {
    existingTransaction: Transaction
    newTransactionData: Record<string, unknown>
    resumeIndex?: number
  }
}
