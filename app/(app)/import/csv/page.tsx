import { ImportCSVTable } from "@/components/import/csv"
import { getCurrentUser } from "@/lib/auth"
import { getFields } from "@/models/fields"
import { getProjects } from "@/models/projects"

export default async function CSVImportPage() {
  const user = await getCurrentUser()
  const fields = await getFields(user.id)
  const projects = await getProjects(user.id)
  return (
    <div className="flex flex-col gap-4 p-4">
      <ImportCSVTable fields={fields} projects={projects} />
    </div>
  )
}
