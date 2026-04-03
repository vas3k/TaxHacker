import { parse } from "date-fns"
import { TransactionData } from "@/models/transactions"
import { importCategory } from "@/models/export_and_import"

export type ChaseRow = Record<string, string>

const CHASE_DATE_FORMAT = "MM/dd/yyyy"

const parseDate = (value?: string) => {
  if (!value) return undefined
  try {
    const parsed = parse(value.trim(), CHASE_DATE_FORMAT, new Date())
    return isNaN(parsed.getTime()) ? undefined : parsed
  } catch (_error) {
    return undefined
  }
}

const parseAmount = (value?: string) => {
  if (!value) return 0
  const cleaned = value.replace(/,/g, "").replace(/[()]/g, "").trim()
  const amount = Number(cleaned)
  return Number.isNaN(amount) ? 0 : amount
}

const detectNegative = (value?: string) => {
  if (!value) return false
  return value.includes("-") || value.trim().startsWith("(")
}

export async function mapChaseRowToTransaction(
  userId: string,
  row: ChaseRow
): Promise<Partial<TransactionData>> {
  const rawAmount = row["Amount"] ?? ""
  const amount = parseAmount(rawAmount)
  const cents = Math.round(Math.abs(amount) * 100)
  const isRefund = detectNegative(rawAmount)

  let categoryCode: string | undefined
  if (row["Category"]) {
    const category = await importCategory(userId, row["Category"])
    if (category) {
      categoryCode = category.code
    }
  }

  const description = row["Description"]?.trim() || undefined
  const merchant = description

  return {
    name: description,
    merchant,
    issuedAt: parseDate(row["Transaction Date"]) ?? parseDate(row["Post Date"]),
    total: cents,
    currencyCode: "USD",
    type: isRefund ? "income" : "expense",
    importReference:
      row["Transaction ID"]?.trim() ||
      row["Reference Number"]?.trim() ||
      [row["Transaction Date"], row["Description"], row["Amount"]].filter(Boolean).join("|") ||
      undefined,
    categoryCode,
    extra: {
      postDate: row["Post Date"],
      category: row["Category"],
      statementType: row["Type"],
      memo: row["Memo"],
    },
  }
}
