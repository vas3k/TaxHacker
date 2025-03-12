import { format } from "date-fns"

type HistoricRate = {
  currency: string
  rate: number
  inverse: number
}

export async function getCurrencyRate(currencyCodeFrom: string, currencyCodeTo: string, date: Date): Promise<number> {
  const rates = await fetchHistoricalCurrencyRates(currencyCodeFrom, date)

  if (!rates || rates.length === 0) {
    console.log("Could not fetch currency rates", currencyCodeFrom, currencyCodeTo, date)
    return 0
  }

  const rate = rates.find((rate) => rate.currency === currencyCodeTo)

  if (!rate) {
    console.log("Could not find currency rate", currencyCodeFrom, currencyCodeTo, date)
    return 0
  }

  return rate.rate
}

export async function fetchHistoricalCurrencyRates(currency: string = "USD", date: Date): Promise<HistoricRate[]> {
  const formattedDate = format(date, "yyyy-MM-dd")

  const url = `https://corsproxy.io/?${encodeURIComponent(
    `https://www.xe.com/currencytables/?from=${currency}&date=${formattedDate}`
  )}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }

  const html = await response.text()

  // Extract the JSON data from the __NEXT_DATA__ script tag
  const scriptTagRegex = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  const match = html.match(scriptTagRegex)

  if (!match || !match[1]) {
    throw new Error("Could not find currency data in the page")
  }

  const jsonData = JSON.parse(match[1])

  const historicRates = jsonData.props.pageProps.historicRates as HistoricRate[]

  console.log("Historic Rates for this date", historicRates)

  return historicRates
}
