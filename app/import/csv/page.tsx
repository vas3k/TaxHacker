import { ImportCSVTable } from "@/components/import/csv"
import { getFields } from "@/models/fields"

export default async function CSVImportPage() {
  const fields = await getFields()
  return (
    <div className="flex flex-col gap-4 p-4">
      <ImportCSVTable fields={fields} />
    </div>
  )
}
