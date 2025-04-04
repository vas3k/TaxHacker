import { formatCurrency } from "@/lib/utils"
import { format, startOfDay } from "date-fns"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

export const FormConvertCurrency = ({
  originalTotal,
  originalCurrencyCode,
  targetCurrencyCode,
  date,
  onChange,
}: {
  originalTotal: number
  originalCurrencyCode: string
  targetCurrencyCode: string
  date?: Date | undefined
  onChange?: (value: number) => void
}) => {
  if (
    originalTotal === 0 ||
    !originalCurrencyCode ||
    !targetCurrencyCode ||
    originalCurrencyCode === targetCurrencyCode
  ) {
    return <></>
  }

  const normalizedDate = startOfDay(date || new Date(Date.now() - 24 * 60 * 60 * 1000))
  const [exchangeRate, setExchangeRate] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const exchangeRate = await getCurrencyRate(originalCurrencyCode, targetCurrencyCode, normalizedDate)
        setExchangeRate(exchangeRate)
        onChange?.(originalTotal * exchangeRate)
      } catch (error) {
        console.error("Error fetching currency rates:", error)
        setExchangeRate(0)
        onChange?.(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [originalCurrencyCode, targetCurrencyCode, format(normalizedDate, "LLLL-mm-dd")])

  return (
    <div className="flex flex-row gap-2 items-center text-muted-foreground">
      {isLoading ? (
        <div className="flex flex-row gap-2">
          <Loader2 className="animate-spin" />
          <div>Loading exchange rates...</div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div>{formatCurrency(originalTotal * 100, originalCurrencyCode)}</div>
          <div>=</div>
          <div>{formatCurrency(originalTotal * 100 * exchangeRate, targetCurrencyCode).slice(0, 1)}</div>
          <input
            type="number"
            step="0.01"
            name="convertedTotal"
            value={(originalTotal * exchangeRate).toFixed(2)}
            onChange={(e) => onChange?.(parseFloat(e.target.value))}
            className="w-32 rounded-md border border-input bg-transparent  px-1"
          />
          <div className="text-xs">(exchange rate on {format(normalizedDate, "LLLL dd, yyyy")})</div>
        </div>
      )}
    </div>
  )
}

async function getCurrencyRate(currencyCodeFrom: string, currencyCodeTo: string, date: Date): Promise<number> {
  try {
    const formattedDate = format(date, "yyyy-MM-dd")
    const url = `/api/currency?from=${currencyCodeFrom}&to=${currencyCodeTo}&date=${formattedDate}`

    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Currency API error:", errorData.error)
      return 0
    }

    const data = await response.json()
    return data.rate
  } catch (error) {
    console.error("Error fetching currency rate:", error)
    return 0
  }
}
