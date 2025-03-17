import { TransactionFilters } from "@/data/transactions"
import { format } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function searchParamsToFilters(searchParams: URLSearchParams) {
  return {
    search: searchParams.get("search") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    categoryCode: searchParams.get("categoryCode") || "",
    projectCode: searchParams.get("projectCode") || "",
  }
}

export function filtersToSearchParams(filters: TransactionFilters): URLSearchParams {
  const searchParams = new URLSearchParams()
  if (filters.search) {
    searchParams.set("search", filters.search)
  } else {
    searchParams.delete("search")
  }

  if (filters.dateFrom) {
    searchParams.set("dateFrom", format(new Date(filters.dateFrom), "yyyy-MM-dd"))
  } else {
    searchParams.delete("dateFrom")
  }

  if (filters.dateTo) {
    searchParams.set("dateTo", format(new Date(filters.dateTo), "yyyy-MM-dd"))
  } else {
    searchParams.delete("dateTo")
  }

  if (filters.categoryCode && filters.categoryCode !== "-") {
    searchParams.set("categoryCode", filters.categoryCode)
  } else {
    searchParams.delete("categoryCode")
  }

  if (filters.projectCode && filters.projectCode !== "-") {
    searchParams.set("projectCode", filters.projectCode)
  } else {
    searchParams.delete("projectCode")
  }

  return searchParams
}

export function useTransactionFilters(defaultFilters?: TransactionFilters) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<TransactionFilters>({
    ...defaultFilters,
    ...searchParamsToFilters(searchParams),
  })

  useEffect(() => {
    const newSearchParams = filtersToSearchParams(filters)
    router.push(`?${newSearchParams.toString()}`)
  }, [filters])

  useEffect(() => {
    setFilters(searchParamsToFilters(searchParams))
  }, [searchParams])

  return [filters, setFilters] as const
}
