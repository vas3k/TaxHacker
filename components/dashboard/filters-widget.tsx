"use client"

import { DateRangePicker } from "@/components/forms/date-range-picker"
import { useTransactionFilters } from "@/hooks/use-transaction-filters"
import { TransactionFilters } from "@/models/transactions"
import { format } from "date-fns"

export function FiltersWidget({
  defaultFilters,
  defaultRange = "last-12-months",
}: {
  defaultFilters: TransactionFilters
  defaultRange?: string
}) {
  const [filters, setFilters] = useTransactionFilters(defaultFilters)

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
