"use client"

import { DateRangePicker } from "@/components/forms/date-range-picker"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TransactionFilters } from "@/data/transactions"
import { useTransactionFilters } from "@/hooks/use-transaction-filters"
import { Category, Project } from "@prisma/client"

export function TransactionSearchAndFilters({ categories, projects }: { categories: Category[]; projects: Project[] }) {
  const [filters, setFilters] = useTransactionFilters()

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
      </div>
    </div>
  )
}
