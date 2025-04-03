import { cn } from "@/lib/utils"

export function FormError({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-red-500 mt-4 overflow-hidden", className)}>{children}</p>
}
