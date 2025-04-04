import { format } from "date-fns"
import { NextRequest, NextResponse } from "next/server"

type HistoricRate = {
  currency: string
  rate: number
  inverse: number
}

export async function GET(request: NextRequest) {
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

    return NextResponse.json({ rate: rate.rate })
  } catch (error) {
    console.error("Currency API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
