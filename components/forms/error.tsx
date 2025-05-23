import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

export function FormError({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 text-red-700 border border-red-200",
        className
      )}
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <p className="text-sm">{children}</p>
    </div>
  )
}
