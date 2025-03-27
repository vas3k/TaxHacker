"use client"

import {
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  Pagination as PaginationRoot,
} from "@/components/ui/pagination"
import { useRouter, useSearchParams } from "next/navigation"

const MAX_VISIBLE_PAGES = 5

export function Pagination({ totalItems, itemsPerPage = 1000 }: { totalItems: number; itemsPerPage: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const currentPage = parseInt(searchParams.get("page") || "1")

  const onPageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`?${params.toString()}`)
  }

  const getPageNumbers = () => {
    const pageNumbers = []

    // Show all page numbers if total pages is small
    if (totalPages <= MAX_VISIBLE_PAGES) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always include the first page
      pageNumbers.push(1)

      // Calculate the range around the current page
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the start
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4)
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3)
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push("ellipsis-start")
      }

      // Add middle page numbers
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push("ellipsis-end")
      }

      // Always include the last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  return (
    <div className="flex justify-center w-full mt-4">
      <PaginationRoot>
        <PaginationContent>
          {/* <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem> */}

          {getPageNumbers().map((pageNumber, index) =>
            pageNumber === "ellipsis-start" || pageNumber === "ellipsis-end" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  isActive={currentPage === pageNumber}
                  onClick={() => onPageChange(pageNumber as number)}
                  className="cursor-pointer"
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          {/* <PaginationItem>
            <PaginationNext
              onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem> */}
        </PaginationContent>
      </PaginationRoot>
    </div>
  )
}
