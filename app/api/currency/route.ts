import { getSession } from "@/lib/auth"
import { PoorManCache } from "@/lib/cache"
import { format, isSameDay, subDays } from "date-fns"
import { NextRequest, NextResponse } from "next/server"

type HistoricRate = {
  currency: string
  rate: number
  inverse: number
}

type RateProvider = {
  name: string
  fetch: (fromCurrency: string, toCurrency: string, date: string) => Promise<number | null>
}

const currencyCache = new PoorManCache<number>(24 * 60 * 60 * 1000) // 24 hours

function generateCacheKey(fromCurrency: string, toCurrency: string, date: string): string {
  return `${fromCurrency},${toCurrency},${date}`
}

const CLEANUP_INTERVAL = 90 * 60 * 1000
if (typeof setInterval !== "undefined") {
  setInterval(() => currencyCache.cleanup(), CLEANUP_INTERVAL)
}

async function fetchFromXe(fromCurrency: string, toCurrency: string, date: string): Promise<number | null> {
  const url = `https://www.xe.com/currencytables/?from=${fromCurrency}&date=${date}`

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 86400 },
    })

    if (!response.ok) {
      console.warn(`xe.com returned ${response.status} for ${fromCurrency}->${toCurrency} on ${date}`)
      return null
    }

    const html = await response.text()
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
    if (!match?.[1]) {
      console.warn(`xe.com page missing __NEXT_DATA__ for ${fromCurrency} on ${date}`)
      return null
    }

    const jsonData = JSON.parse(match[1])
    const historicRates = jsonData.props?.pageProps?.historicRates as HistoricRate[] | undefined
    const rate = historicRates?.find((r) => r.currency === toCurrency.toUpperCase())

    if (typeof rate?.rate !== "number") {
      console.warn(`xe.com missing rate for ${fromCurrency}->${toCurrency} on ${date}`)
      return null
    }

    return rate.rate
  } catch (error) {
    console.warn(`xe.com failed for ${fromCurrency}->${toCurrency} on ${date}:`, error)
    return null
  }
}

async function fetchFromCurrencyApi(fromCurrency: string, toCurrency: string, date: string): Promise<number | null> {
  const from = fromCurrency.toLowerCase()
  const to = toCurrency.toLowerCase()
  const endpoint = `v1/currencies/${from}.min.json`

  const urls = [
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/${endpoint}`,
    `https://${date}.currency-api.pages.dev/${endpoint}`,
  ]

  for (const url of urls) {
    try {
      const response = await fetch(url, { next: { revalidate: 86400 } })
      if (!response.ok) {
        console.warn(`Currency API upstream ${url} returned ${response.status}`)
        continue
      }

      const data = await response.json()
      const rate = data?.[from]?.[to]
      if (typeof rate === "number") {
        return rate
      }

      console.warn(`Currency API upstream ${url} missing rate for ${fromCurrency}->${toCurrency}`)
    } catch (error) {
      console.warn(`Currency API upstream ${url} failed:`, error)
    }
  }

  return null
}

async function fetchFromFrankfurter(fromCurrency: string, toCurrency: string, date: string): Promise<number | null> {
  // Fiat only (ECB + other central banks) — useful for older dates
  const url = `https://api.frankfurter.dev/v2/rate/${fromCurrency.toUpperCase()}/${toCurrency.toUpperCase()}?date=${date}`

  try {
    const response = await fetch(url, { next: { revalidate: 86400 } })
    if (!response.ok) {
      console.warn(`Frankfurter returned ${response.status} for ${fromCurrency}->${toCurrency} on ${date}`)
      return null
    }

    const data = await response.json()
    if (typeof data?.rate === "number") {
      return data.rate
    }
  } catch (error) {
    console.warn(`Frankfurter failed:`, error)
  }

  return null
}

// Tried in order until one returns a rate
const RATE_PROVIDERS: RateProvider[] = [
  { name: "xe.com", fetch: fetchFromXe },
  { name: "currency-api", fetch: fetchFromCurrencyApi },
  { name: "frankfurter", fetch: fetchFromFrankfurter },
]

async function fetchRate(fromCurrency: string, toCurrency: string, date: string): Promise<{ rate: number; source: string } | null> {
  const pair = `${fromCurrency}->${toCurrency} on ${date}`

  for (const provider of RATE_PROVIDERS) {
    console.log(`[currency] Trying ${provider.name} for ${pair}`)
    const rate = await provider.fetch(fromCurrency, toCurrency, date)
    if (rate !== null) {
      console.log(`[currency] ${provider.name} succeeded for ${pair}: ${rate}`)
      return { rate, source: provider.name }
    }
    console.log(`[currency] ${provider.name} failed for ${pair}, trying next`)
  }

  console.error(`[currency] All providers failed for ${pair}`)
  return null
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

    // Rates for "today" are often not published yet — use yesterday
    if (isSameDay(date, new Date())) {
      date = subDays(date, 1)
    }

    const formattedDate = format(date, "yyyy-MM-dd")

    const cacheKey = generateCacheKey(fromCurrency, toCurrency, formattedDate)
    const cachedRate = currencyCache.get(cacheKey)

    if (cachedRate !== undefined) {
      return NextResponse.json({ rate: cachedRate, cached: true })
    }

    const result = await fetchRate(fromCurrency, toCurrency, formattedDate)

    if (!result) {
      console.error(`No currency rate found for ${fromCurrency}->${toCurrency} on ${formattedDate}`)
      return NextResponse.json(
        { error: `Currency rate not found for ${fromCurrency} to ${toCurrency} on ${formattedDate}` },
        { status: 404 }
      )
    }

    currencyCache.set(cacheKey, result.rate)

    return NextResponse.json({ rate: result.rate, source: result.source, cached: false })
  } catch (error) {
    console.error("Currency API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
