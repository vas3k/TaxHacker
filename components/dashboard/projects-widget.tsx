import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ProjectStats } from "@/models/stats"
import { Project } from "@prisma/client"
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
        <Card key={project.code}>
          <CardHeader>
            <CardTitle>
              <Link href={`/transactions?projectCode=${project.code}`}>
                <Badge className="text-lg" style={{ backgroundColor: project.color }}>
                  {project.name}
                </Badge>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div>
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
              <div>
                <div className="text-sm font-medium text-muted-foreground">Expenses</div>
                <div className="text-2xl font-bold text-red-500">
                  {Object.entries(statsPerProject[project.code]?.totalExpensesPerCurrency).map(([currency, total]) => (
                    <div key={currency} className="flex flex-col gap-2 font-bold text-red-500 text-base first:text-2xl">
                      {formatCurrency(total, currency)}
                    </div>
                  ))}
                  {!Object.entries(statsPerProject[project.code]?.totalExpensesPerCurrency).length && (
                    <div className="font-bold text-base first:text-2xl">0.00</div>
                  )}
                </div>
              </div>
              <div>
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
      ))}
      <Link
        href="/settings/projects"
        className="flex items-center justify-center gap-2 border-dashed border-2 border-gray-300 rounded-md p-4 text-muted-foreground hover:text-primary hover:border-primary"
      >
        <Plus className="h-4 w-4" />
        Create New Project
      </Link>
    </div>
  )
}
