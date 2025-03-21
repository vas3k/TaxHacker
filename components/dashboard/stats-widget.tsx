import { getProjects } from "@/data/projects"
import { getDashboardStats, getProjectStats } from "@/data/stats"
import { TransactionFilters } from "@/data/transactions"
import { formatCurrency } from "@/lib/utils"
import { ArrowDown, ArrowUp, BicepsFlexed } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { FiltersWidget } from "./filters-widget"
import { ProjectsWidget } from "./projects-widget"

export async function StatsWidget({ filters }: { filters: TransactionFilters }) {
  const projects = await getProjects()
  const stats = await getDashboardStats(filters)
  const statsPerProject = Object.fromEntries(
    await Promise.all(
      projects.map((project) => getProjectStats(project.code, filters).then((stats) => [project.code, stats]))
    )
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Overview</h2>

        <FiltersWidget defaultFilters={filters} defaultRange="last-12-months" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {Object.entries(stats.totalIncomePerCurrency).map(([currency, total]) => (
              <div key={currency} className="flex gap-2 items-center font-bold text-base first:text-2xl text-green-500">
                {formatCurrency(total, currency)}
              </div>
            ))}
            {!Object.entries(stats.totalIncomePerCurrency).length && <div className="text-2xl font-bold">0.00</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {Object.entries(stats.totalExpensesPerCurrency).map(([currency, total]) => (
              <div key={currency} className="flex gap-2 items-center font-bold text-base first:text-2xl text-red-500">
                {formatCurrency(total, currency)}
              </div>
            ))}
            {!Object.entries(stats.totalExpensesPerCurrency).length && <div className="text-2xl font-bold">0.00</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <BicepsFlexed className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            {Object.entries(stats.profitPerCurrency).map(([currency, total]) => (
              <div
                key={currency}
                className={`flex gap-2 items-center font-bold text-base first:text-2xl ${
                  total >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {formatCurrency(total, currency)}
              </div>
            ))}
            {!Object.entries(stats.profitPerCurrency).length && <div className="text-2xl font-bold">0.00</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invoicesProcessed}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Projects</h2>
      </div>

      <ProjectsWidget projects={projects} statsPerProject={statsPerProject} />
    </div>
  )
}
