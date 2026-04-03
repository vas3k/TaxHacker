import { parse } from "date-fns"
import { TransactionData } from "@/models/transactions"
import { importCategory } from "@/models/export_and_import"

export type AmexRow = Record<string, string>

const AMEX_DATE_FORMAT = "MM/dd/yyyy"

const parseDate = (value?: string) => {
  if (!value) return undefined
  try {
    const parsed = parse(value.trim(), AMEX_DATE_FORMAT, new Date())
    return isNaN(parsed.getTime()) ? undefined : parsed
  } catch (_error) {
    return undefined
  }
}

const parseAmount = (value?: string) => {
  if (!value) return 0
  const cleaned = value.replace(/,/g, "").trim()
  const amount = Number(cleaned)
  return Number.isNaN(amount) ? 0 : amount
}

const normalizeReference = (value?: string) =>
  value ? value.replace(/['"]/g, "").trim() || undefined : undefined

export async function mapAmexRowToTransaction(
  userId: string,
  row: AmexRow
): Promise<Partial<TransactionData>> {
  const amount = parseAmount(row["Amount"])
  const cents = Math.round(Math.abs(amount) * 100)
  const total = cents
  const descriptionText =
    row["Extended Details"]?.trim() || row["Appears On Your Statement As"]?.trim() || row["Description"]?.trim() || ""
  const normalizedDescription = descriptionText.replace(/\s+/g, " ").trim().toUpperCase()
  const isCardPayment = normalizedDescription.includes("ONLINE PAYMENT - THANK YOU")

  const type = amount < 0 ? "income" : "expense"

  let categoryCode: string | undefined
  if (row["Category"]) {
    const category = await importCategory(userId, row["Category"])
    if (category) {
      categoryCode = category.code
    }
  }

  const merchant =
    row["Description"]?.trim() ||
    row["Appears On Your Statement As"]?.trim() ||
    row["Extended Details"]?.trim() ||
    (isCardPayment ? "Card Payment" : undefined)
  const name = isCardPayment ? "Card Payment" : merchant
  const description =
    row["Extended Details"]?.trim() ||
    row["Appears On Your Statement As"]?.trim() ||
    row["Description"]?.trim() ||
    undefined
  const address = [row["Address"], row["City/State"], row["Zip Code"], row["Country"]]
    .map((part) => (part || "").trim())
    .filter((part) => part.length > 0)
    .join(", ") || undefined

  return {
    name,
    merchant,
    issuedAt: parseDate(row["Date"]),
    total,
    currencyCode: "USD",
    type,
    importReference: normalizeReference(row["Reference"]),
    categoryCode,
    extra: {
      address,
      cardPayment: isCardPayment,
      receipt: row["Receipt"],
      cardMember: row["Card Member"],
      accountNumber: row["Account #"],
      extendedDetails: description,
      statementDescriptor: row["Appears On Your Statement As"],
      cityState: row["City/State"],
      zipCode: row["Zip Code"],
      country: row["Country"],
    },
    description,
  }
}
