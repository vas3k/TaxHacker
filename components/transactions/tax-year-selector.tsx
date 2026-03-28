"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMemo } from "react"

interface TaxYearSelectorProps {
  taxYearStart: string // Format: "MM-DD", e.g., "04-06"
  value?: string // Selected tax year, e.g., "2024-2025"
  onChange: (dateFrom: Date | undefined, dateTo: Date | undefined) => void
}

/**
 * Generates available tax years from a given start date.
 * Tax years are displayed as "2023-2024" format.
 */
export function TaxYearSelector({ taxYearStart, value, onChange }: TaxYearSelectorProps) {
  const [startMonth, startDay] = useMemo(() => {
    const parts = (taxYearStart || "01-01").split("-").map(Number)
    return [parts[0] || 1, parts[1] || 1]
  }, [taxYearStart])

  // Generate tax years from 5 years ago to current year + 1
  const taxYears = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years: { label: string; startDate: Date; endDate: Date }[] = []

    // If tax year starts on Jan 1, use single year format
    const isCalendarYear = startMonth === 1 && startDay === 1

    for (let year = currentYear + 1; year >= currentYear - 10; year--) {
      if (isCalendarYear) {
        // Calendar year: Jan 1 to Dec 31
        years.push({
          label: `${year}`,
          startDate: new Date(year, 0, 1),
          endDate: new Date(year, 11, 31),
        })
      } else {
        // Fiscal year: e.g., Apr 6, 2023 to Apr 5, 2024 shown as "2023-2024"
        const startDate = new Date(year, startMonth - 1, startDay)
        const endDate = new Date(year + 1, startMonth - 1, startDay - 1)
        years.push({
          label: `${year}-${year + 1}`,
          startDate,
          endDate,
        })
      }
    }

    return years
  }, [startMonth, startDay])

  const handleChange = (selectedLabel: string) => {
    if (selectedLabel === "-") {
      onChange(undefined, undefined)
      return
    }

    const selectedYear = taxYears.find((y) => y.label === selectedLabel)
    if (selectedYear) {
      onChange(selectedYear.startDate, selectedYear.endDate)
    }
  }

  return (
    <Select value={value || "-"} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Tax Year" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="-">All Years</SelectItem>
        {taxYears.map((year) => (
          <SelectItem key={year.label} value={year.label}>
            {year.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
