"use client"

import { Card } from "@/components/ui/card"
import type { CategoryTotal, PeriodAverage } from "@/lib/stats"
import { cn, formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { KeyboardEvent, useId, useRef, useState } from "react"

type BreakdownType = "expenses" | "income"

const TABS: { value: BreakdownType; label: string; transactionType: string; tone: string }[] = [
  { value: "expenses", label: "Expenses", transactionType: "expense", tone: "text-red-600" },
  { value: "income", label: "Income", transactionType: "income", tone: "text-green-600" },
]

const SIZE = 200
const RADIUS = 78
const STROKE = 24
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const SEGMENT_GAP = 2

interface CategoryBreakdownChartProps {
  expenses: CategoryTotal[]
  income: CategoryTotal[]
  currency: string
  periods: number
  periodUnit: PeriodAverage["unit"]
  dateFrom?: string
  dateTo?: string
}

export function CategoryBreakdownChart({
  expenses,
  income,
  currency,
  periods,
  periodUnit,
  dateFrom,
  dateTo,
}: CategoryBreakdownChartProps) {
  const router = useRouter()
  const id = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [selected, setSelected] = useState<BreakdownType>("expenses")
  const [activeCode, setActiveCode] = useState<string | null>(null)
  const [hasSwitched, setHasSwitched] = useState(false)

  const tab = TABS.find((t) => t.value === selected)!
  const items = selected === "expenses" ? expenses : income
  const total = items.reduce((sum, item) => sum + item.total, 0)
  const active = items.find((item) => item.code === activeCode)
  const gap = items.length > 1 ? SEGMENT_GAP : 0

  const segments: (CategoryTotal & { length: number; offset: number })[] = []
  let offset = 0
  for (const item of items) {
    const length = (item.total / total) * CIRCUMFERENCE
    segments.push({ ...item, length, offset })
    offset += length
  }

  const hrefFor = (code: string) => {
    const params = new URLSearchParams({ type: tab.transactionType, categoryCode: code })
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)
    return `/transactions?${params.toString()}`
  }

  const percentOf = (value: number) => {
    const percent = (value / total) * 100
    return percent < 1 ? "<1%" : `${Math.round(percent)}%`
  }

  const selectTab = (value: BreakdownType) => {
    setSelected(value)
    setActiveCode(null)
    setHasSwitched(true)
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return
    event.preventDefault()
    const next = (index + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length
    selectTab(TABS[next].value)
    tabRefs.current[next]?.focus()
  }

  return (
    <Card className="flex flex-col gap-4 p-4 lg:h-[400px]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">By category</h3>
        <div role="tablist" aria-label="Category breakdown" className="grid grid-cols-2 rounded-lg bg-muted p-0.5">
          {TABS.map((t, index) => {
            const isSelected = t.value === selected
            return (
              <button
                key={t.value}
                ref={(el) => {
                  tabRefs.current[index] = el
                }}
                id={`${id}-tab-${t.value}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`${id}-panel`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => selectTab(t.value)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected ? cn("bg-background shadow-sm", t.tone) : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${selected}`}
        className="flex min-h-0 flex-1 flex-col gap-4"
      >
        <div className="relative mx-auto size-44 shrink-0">
          <svg
            key={selected}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className={cn(
              "size-full -rotate-90",
              hasSwitched &&
                "motion-safe:animate-in motion-safe:fade-in motion-safe:spin-in-[-8deg] motion-safe:duration-300 motion-safe:ease-out"
            )}
            aria-hidden="true"
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              className="stroke-muted"
              style={{ strokeWidth: STROKE }}
            />
            {segments.map((segment) => {
              const isActive = segment.code === activeCode
              return (
                <circle
                  key={segment.code}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={segment.color}
                  strokeDasharray={`${Math.max(segment.length - gap, 0.75)} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-segment.offset}
                  className="cursor-pointer transition-[opacity,stroke-width] duration-200 ease-out"
                  style={{
                    strokeWidth: isActive ? STROKE + 6 : STROKE,
                    opacity: activeCode && !isActive ? 0.25 : 1,
                  }}
                  onMouseEnter={() => setActiveCode(segment.code)}
                  onMouseLeave={() => setActiveCode(null)}
                  onClick={() => router.push(hrefFor(segment.code))}
                />
              )
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-9 text-center">
            <span className="w-full truncate text-xs text-muted-foreground">
              {active ? active.name : `Total ${tab.label.toLowerCase()}`}
            </span>
            <span className={cn("text-base font-bold tabular-nums leading-tight", tab.tone)}>
              {formatCurrency(active ? active.total : total, currency)}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {active
                ? `${percentOf(active.total)} of ${tab.label.toLowerCase()}`
                : `${items.length} ${items.length === 1 ? "category" : "categories"}`}
            </span>
          </div>
        </div>

        {items.length > 0 ? (
          <ul className="-mx-2 -mb-4 grid max-h-72 min-h-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto_auto] content-start overflow-y-auto pb-6 [mask-image:linear-gradient(to_bottom,black_calc(100%-1.5rem),transparent)] lg:max-h-none">
            <li
              aria-hidden="true"
              className="sticky top-0 z-10 col-span-full grid grid-cols-subgrid gap-x-2 bg-card px-2 pb-1 text-xs text-muted-foreground"
            >
              <span className="col-span-2">Category</span>
              <span className="text-right">Total</span>
              <span className="text-right">Avg / {periodUnit}</span>
            </li>
            {items.map((item) => (
              <li key={item.code} className="col-span-full grid grid-cols-subgrid">
                <Link
                  href={hrefFor(item.code)}
                  onMouseEnter={() => setActiveCode(item.code)}
                  onMouseLeave={() => setActiveCode(null)}
                  onFocus={() => setActiveCode(item.code)}
                  onBlur={() => setActiveCode(null)}
                  className={cn(
                    "col-span-full grid grid-cols-subgrid items-center gap-x-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    item.code === activeCode && "bg-muted"
                  )}
                >
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                  <span className="text-right text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(item.total, currency)}
                  </span>
                  <span className="text-right font-medium tabular-nums">
                    {formatCurrency(item.total / periods, currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-balance px-4 text-center text-sm text-muted-foreground">
            No {tab.label.toLowerCase()} in this period. Categorized {tab.label.toLowerCase()} will show up here.
          </p>
        )}
      </div>
    </Card>
  )
}
