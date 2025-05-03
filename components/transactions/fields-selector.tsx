"use client"

import { updateFieldVisibilityAction } from "@/app/(app)/transactions/actions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field } from "@/prisma/client"
import { ColumnsIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function ColumnSelector({ fields, onChange }: { fields: Field[]; onChange?: () => void }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({})

  const handleToggle = async (fieldCode: string, isCurrentlyVisible: boolean) => {
    setIsLoading((prev) => ({ ...prev, [fieldCode]: true }))

    try {
      await updateFieldVisibilityAction(fieldCode, !isCurrentlyVisible)

      // Refresh the page to reflect changes
      if (onChange) {
        onChange()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to toggle column visibility:", error)
    } finally {
      setIsLoading((prev) => ({ ...prev, [fieldCode]: false }))
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" title="Select table columns">
          <ColumnsIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {fields.map((field) => (
          <DropdownMenuCheckboxItem
            key={field.code}
            checked={field.isVisibleInList}
            onCheckedChange={() => handleToggle(field.code, field.isVisibleInList)}
            disabled={isLoading[field.code]}
          >
            {field.name}
            {isLoading[field.code] && <span className="ml-2 text-xs opacity-50">Saving...</span>}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
