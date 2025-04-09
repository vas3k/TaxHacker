import { getSession } from "@/lib/auth"
import { PoorManCache } from "@/lib/cache"
import { format, isSameDay, subDays } from "date-fns"
import { NextRequest, NextResponse } from "next/server"

type HistoricRate = {
  currency: string
  rate: number
  inverse: number
}

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

    let date = new Date(dateParam)

    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
    }

    // hack to get yesterday's rate if it's today
    if (isSameDay(date, new Date())) {
      date = subDays(date, 1)
    }

    const formattedDate = format(date, "yyyy-MM-dd")

    // Check cache first
    const cacheKey = generateCacheKey(fromCurrency, toCurrency, formattedDate)
    const cachedRate = currencyCache.get(cacheKey)

    if (cachedRate !== undefined) {
      return NextResponse.json({ rate: cachedRate, cached: true })
    }

    const url = `https://www.xe.com/currencytables/?from=${fromCurrency}&date=${formattedDate}`

    const response = await fetch(url)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch currency data: ${response.status}` },
        { status: response.status }
      )
    }

    const html = await response.text()

    // Extract the JSON data from the __NEXT_DATA__ script tag
    const scriptTagRegex = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
    const match = html.match(scriptTagRegex)

    if (!match || !match[1]) {
      return NextResponse.json({ error: "Could not find currency data in the page" }, { status: 500 })
    }

    const jsonData = JSON.parse(match[1])
    const historicRates = jsonData.props.pageProps.historicRates as HistoricRate[]

    if (!historicRates || historicRates.length === 0) {
      return NextResponse.json({ error: "No currency rates found for the specified date" }, { status: 404 })
    }

    const rate = historicRates.find((rate) => rate.currency === toCurrency)

    if (!rate) {
      return NextResponse.json({ error: `Currency rate not found for ${toCurrency}` }, { status: 404 })
    }

    // Store in cache
    currencyCache.set(cacheKey, rate.rate)

    return NextResponse.json({ rate: rate.rate, cached: false })
  } catch (error) {
    console.error("Currency API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
