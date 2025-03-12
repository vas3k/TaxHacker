"use client"

import { StatsFilters } from "@/data/stats"
import { format } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { DateRangePicker } from "../forms/date-range-picker"

export function FiltersWidget({
  defaultFilters,
  defaultRange = "last-12-months",
}: {
  defaultFilters: StatsFilters
  defaultRange?: string
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [filters, setFilters] = useState<StatsFilters>(defaultFilters)

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (filters?.dateFrom) {
      params.set("dateFrom", format(new Date(filters.dateFrom), "yyyy-MM-dd"))
    } else {
      params.delete("dateFrom")
    }
    if (filters?.dateTo) {
      params.set("dateTo", format(new Date(filters.dateTo), "yyyy-MM-dd"))
    } else {
      params.delete("dateTo")
    }
    router.push(`?${params.toString()}`)
  }

  useEffect(() => {
    applyFilters()
  }, [filters])

  return (
    <DateRangePicker
      defaultDate={{
        from: filters?.dateFrom ? new Date(filters.dateFrom) : undefined,
        to: filters?.dateTo ? new Date(filters.dateTo) : undefined,
      }}
      defaultRange={defaultRange}
      onChange={(date) => {
        setFilters({
          dateFrom: date && date.from ? format(date.from, "yyyy-MM-dd") : undefined,
          dateTo: date && date.to ? format(date.to, "yyyy-MM-dd") : undefined,
        })
      }}
    />
  )
}
