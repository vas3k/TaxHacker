import { cn } from "@/lib/utils"

export function ColoredText({
  children,
  className,
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent", className)}>
      {children}
    </span>
  )
}
