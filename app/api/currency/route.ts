import { getSession } from "@/lib/auth"
import { PoorManCache } from "@/lib/cache"
import { getCurrencyRate } from "@/lib/currency"
import { format } from "date-fns"
import { NextRequest, NextResponse } from "next/server"

const currencyCache = new PoorManCache<number>(24 * 60 * 60 * 1000) // 24 hours

function generateCacheKey(fromCurrency: string, toCurrency: string, date: string): string {
  return `${fromCurrency},${toCurrency},${date}`
}

const CLEANUP_INTERVAL = 90 * 60 * 1000
if (typeof setInterval !== "undefined") {
  setInterval(() => currencyCache.cleanup(), CLEANUP_INTERVAL)
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const fromCurrency = searchParams.get("from")
    const toCurrency = searchParams.get("to")
    const dateParam = searchParams.get("date")

    if (!fromCurrency || !toCurrency || !dateParam) {
      return NextResponse.json({ error: "Missing required parameters: from, to, date" }, { status: 400 })
    }

    const date = new Date(dateParam)

    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
    }

    const formattedDate = format(date, "yyyy-MM-dd")

    // Check cache first
    const cacheKey = generateCacheKey(fromCurrency, toCurrency, formattedDate)
    const cachedRate = currencyCache.get(cacheKey)

    if (cachedRate !== undefined) {
      return NextResponse.json({ rate: cachedRate, cached: true })
    }

    // Use the shared currency utility
    const rate = await getCurrencyRate(fromCurrency, toCurrency, date)

    // Store in cache
    currencyCache.set(cacheKey, rate)

    return NextResponse.json({ rate, cached: false })
  } catch (error) {
    console.error("Currency API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
