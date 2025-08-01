import { format, isSameDay, subDays } from "date-fns"

type HistoricRate = {
  currency: string
  rate: number
  inverse: number
}

export async function getCurrencyRateFromNBP(currencyCodeFrom: string, currencyCodeTo: string, date: Date): Promise<number> {
  // hack to get yesterday's rate if it's today
  if (isSameDay(date, new Date())) {
    date = subDays(date, 1)
  }

  const formattedDate = format(date, "yyyy-MM-dd")

  const url = `https://api.nbp.pl/api/exchangerates/rates/A/${currencyCodeFrom}/${formattedDate}/`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch currency data: ${response.status}`)
  }

  const json = await response.json()

  // Extract the rate from the new JSON schema
  if (!json.rates || json.rates.length === 0) {
    throw new Error(`No rates found for ${currencyCodeFrom} on ${formattedDate}`)
  }

  const rate = json.rates[0].mid

  return rate
}


export async function getCurrencyRateFromXE(currencyCodeFrom: string, currencyCodeTo: string, date: Date): Promise<number> {
  // hack to get yesterday's rate if it's today
  if (isSameDay(date, new Date())) {
    date = subDays(date, 1)
  }

  const formattedDate = format(date, "yyyy-MM-dd")
  const url = `https://www.xe.com/currencytables/?from=${currencyCodeFrom}&date=${formattedDate}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch currency data: ${response.status}`)
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

  if (!historicRates || historicRates.length === 0) {
    throw new Error("No currency rates found for the specified date")
  }

  const rate = historicRates.find((rate) => rate.currency === currencyCodeTo)

  if (!rate) {
    throw new Error(`Currency rate not found for ${currencyCodeTo}`)
  }

  return rate.rate
}

export async function getCurrencyRate(currencyCodeFrom: string, currencyCodeTo: string, date: Date): Promise<number> {
  try {
    return await getCurrencyRateFromNBP(currencyCodeFrom, currencyCodeTo, date)
  } catch (error) {
    return await getCurrencyRateFromXE(currencyCodeFrom, currencyCodeTo, date)
  }
}