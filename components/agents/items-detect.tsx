import { formatCurrency } from "@/lib/utils"
import { Save, Split } from "lucide-react"
import { Button } from "../ui/button"
import { TransactionData } from "@/models/transactions"
import { splitFileIntoItemsAction } from "@/app/(app)/unsorted/actions"
import { useNotification } from "@/app/(app)/context"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { File } from "@/prisma/client"

export const ItemsDetectTool = ({ file, data }: { file?: File; data: TransactionData }) => {
  const { showNotification } = useNotification()
  const [isSplitting, setIsSplitting] = useState(false)

  const handleSplit = async () => {
    if (!file) {
      console.error("No file selected")
      return
    }

    setIsSplitting(true)
    try {
      const formData = new FormData()
      formData.append("fileId", file.id)
      formData.append("items", JSON.stringify(data.items))

      const result = await splitFileIntoItemsAction(null, formData)
      if (result.success) {
        showNotification({ code: "global.banner", message: "Split successful!", type: "success" })
        showNotification({ code: "sidebar.unsorted", message: "new" })
        setTimeout(() => showNotification({ code: "sidebar.unsorted", message: "" }), 3000)
      } else {
        showNotification({ code: "global.banner", message: result.error || "Failed to split", type: "failed" })
      }
    } catch (error) {
      console.error("Failed to split items:", error)
      showNotification({ code: "global.banner", message: "Failed to split items", type: "failed" })
    } finally {
      setIsSplitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col divide-y divide-border">
        {data.items?.map((item, index) => (
          <div
            key={`${item.name || ""}-${item.merchant || ""}-${item.description || ""}-${index}`}
            className="flex flex-row items-start gap-10 py-2 hover:bg-muted/50 transition-colors"
          >
            <div className="flex flex-col flex-1">
              <div className="text-sm">{item.name}</div>
              <div className="text-xs text-muted-foreground">{item.description}</div>
            </div>
            <div className="font-medium">
              {formatCurrency((item.total || 0) * 100, item.currencyCode || data.currencyCode || "USD")}
            </div>
          </div>
        ))}
      </div>

      {file && data.items && data.items.length > 1 && (
        <Button onClick={handleSplit} className="mt-2 px-4 py-2" disabled={isSplitting}>
          {isSplitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Splitting...
            </>
          ) : (
            <>
              <Split className="w-4 h-4 mr-2" />
              Split into {data.items.length} individual transactions
            </>
          )}
        </Button>
      )}
    </div>
  )
}
