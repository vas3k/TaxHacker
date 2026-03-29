"use client"

import { DateRangePicker } from "@/components/forms/date-range-picker"
import { ColumnSelector } from "@/components/transactions/fields-selector"
import { TaxYearSelector } from "@/components/transactions/tax-year-selector"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isFiltered, useTransactionFilters } from "@/hooks/use-transaction-filters"
import { TransactionFilters } from "@/models/transactions"
import { Category, Field, Project } from "@/prisma/client"
import { format } from "date-fns"
import { X } from "lucide-react"
import { useMemo } from "react"

export function TransactionSearchAndFilters({
  categories,
  projects,
  fields,
  taxYearStart = "01-01",
}: {
  categories: Category[]
  projects: Project[]
  fields: Field[]
  taxYearStart?: string
}) {
  const [filters, setFilters] = useTransactionFilters()

  // Derive selected tax year from current date filters
  const selectedTaxYear = useMemo(() => {
    if (!filters.dateFrom || !filters.dateTo) return undefined

    const [startMonth, startDay] = (taxYearStart || "01-01").split("-").map(Number)
    const isCalendarYear = startMonth === 1 && startDay === 1
    const fromDate = new Date(filters.dateFrom)
    const year = fromDate.getFullYear()

    // Check if the date range matches a tax year
    if (isCalendarYear) {
      const expectedFrom = new Date(year, 0, 1)
      const expectedTo = new Date(year, 11, 31)
      if (
        format(fromDate, "yyyy-MM-dd") === format(expectedFrom, "yyyy-MM-dd") &&
        format(new Date(filters.dateTo), "yyyy-MM-dd") === format(expectedTo, "yyyy-MM-dd")
      ) {
        return `${year}`
      }
    } else {
      const expectedFrom = new Date(year, startMonth - 1, startDay)
      const expectedTo = new Date(year + 1, startMonth - 1, startDay - 1)
      if (
        format(fromDate, "yyyy-MM-dd") === format(expectedFrom, "yyyy-MM-dd") &&
        format(new Date(filters.dateTo), "yyyy-MM-dd") === format(expectedTo, "yyyy-MM-dd")
      ) {
        return `${year}-${year + 1}`
      }
    }

    return undefined
  }, [filters.dateFrom, filters.dateTo, taxYearStart])

  const handleFilterChange = (name: keyof TransactionFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search transactions..."
            defaultValue={filters.search}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleFilterChange("search", (e.target as HTMLInputElement).value)
              }
            }}
            className="w-full"
          />
        </div>

        <Select value={filters.categoryCode} onValueChange={(value) => handleFilterChange("categoryCode", value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.code} value={category.code}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {projects.length > 1 && (
          <Select value={filters.projectCode} onValueChange={(value) => handleFilterChange("projectCode", value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-">All projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.code} value={project.code}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <TaxYearSelector
          taxYearStart={taxYearStart}
          value={selectedTaxYear}
          onChange={(from, to) => {
            handleFilterChange("dateFrom", from)
            handleFilterChange("dateTo", to)
          }}
        />

        <DateRangePicker
          defaultDate={{
            from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
            to: filters.dateTo ? new Date(filters.dateTo) : undefined,
          }}
          onChange={(date) => {
            handleFilterChange("dateFrom", date ? date.from : undefined)
            handleFilterChange("dateTo", date ? date.to : undefined)
          }}
        />

        {isFiltered(filters) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setFilters({})
            }}
            className="text-muted-foreground hover:text-foreground"
            title="Clear all filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <ColumnSelector fields={fields} />
      </div>
    </div>
  )
}
