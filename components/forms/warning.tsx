import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

export function FormWarning({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 text-amber-900 border border-amber-300",
        className
      )}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <p className="text-sm">{children}</p>
    </div>
  )
}
