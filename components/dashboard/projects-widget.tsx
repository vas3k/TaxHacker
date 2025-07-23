import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ProjectStats } from "@/models/stats"
import { Project } from "@/prisma/client"
import { Plus } from "lucide-react"
import Link from "next/link"

export function ProjectsWidget({
  projects,
  statsPerProject,
}: {
  projects: Project[]
  statsPerProject: Record<string, ProjectStats>
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.map((project) => (
        <Link key={project.code} href={`/transactions?projectCode=${project.code}`}>
          <Card className="bg-gradient-to-tr from-white via-slate-50/40 to-purple-50/30 border-slate-200/60 hover:shadow-xl transition-all duration-500 hover:scale-[1.01] group cursor-pointer">
            <CardHeader className="group-hover:translate-y-[-2px] transition-transform duration-300">
              <CardTitle>
                <Badge
                  className="text-lg shadow-md hover:shadow-lg transition-all duration-300"
                  style={{ backgroundColor: project.color }}
                >
                  {project.name}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="group-hover:translate-y-[-1px] transition-transform duration-300">
              <div className="flex flex-wrap gap-4 justify-between items-center">
                <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/60 p-3 rounded-xl border border-green-100/50">
                  <div className="text-sm font-medium text-muted-foreground">Income</div>
                  <div className="text-2xl font-bold text-green-500">
                    {Object.entries(statsPerProject[project.code]?.totalIncomePerCurrency).map(([currency, total]) => (
                      <div
                        key={currency}
                        className="flex flex-col gap-2 font-bold text-green-500 text-base first:text-2xl"
                      >
                        {formatCurrency(total, currency)}
                      </div>
                    ))}
                    {!Object.entries(statsPerProject[project.code]?.totalIncomePerCurrency).length && (
                      <div className="font-bold text-base first:text-2xl">0.00</div>
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-50/80 to-rose-50/60 p-3 rounded-xl border border-red-100/50">
                  <div className="text-sm font-medium text-muted-foreground">Expenses</div>
                  <div className="text-2xl font-bold text-red-500">
                    {Object.entries(statsPerProject[project.code]?.totalExpensesPerCurrency).map(
                      ([currency, total]) => (
                        <div
                          key={currency}
                          className="flex flex-col gap-2 font-bold text-red-500 text-base first:text-2xl"
                        >
                          {formatCurrency(total, currency)}
                        </div>
                      )
                    )}
                    {!Object.entries(statsPerProject[project.code]?.totalExpensesPerCurrency).length && (
                      <div className="font-bold text-base first:text-2xl">0.00</div>
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-violet-50/80 to-indigo-50/60 p-3 rounded-xl border border-violet-100/50">
                  <div className="text-sm font-medium text-muted-foreground">Profit</div>
                  <div className="text-2xl font-bold">
                    {Object.entries(statsPerProject[project.code]?.profitPerCurrency).map(([currency, total]) => (
                      <div
                        key={currency}
                        className={`flex flex-col gap-2 items-center text-2xl font-bold ${
                          total >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {formatCurrency(total, currency)}
                      </div>
                    ))}
                    {!Object.entries(statsPerProject[project.code]?.profitPerCurrency).length && (
                      <div className="text-2xl font-bold">0.00</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
      <Link
        href="/settings/projects"
        className="flex items-center justify-center gap-2 border-dashed border-2 border-gradient-to-r rounded-lg p-6 text-muted-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group"
      >
        <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
        <span className="font-medium">Create New Project</span>
      </Link>
    </div>
  )
}
