import { ImportCSVTable } from "@/components/import/csv"
import { getCurrentUser } from "@/lib/auth"
import { getFields } from "@/models/fields"

export default async function CSVImportPage() {
  const user = await getCurrentUser()
  const fields = await getFields(user.id)
  return (
    <div className="flex flex-col gap-4 p-4">
      <ImportCSVTable fields={fields} />
    </div>
  )
}
