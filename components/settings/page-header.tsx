import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export function SettingsPageHeader({
  title,
  description,
  titleClassName,
  descriptionClassName,
}: {
  title: string
  description: string
  titleClassName?: string
  descriptionClassName?: string
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h2 className={cn("text-2xl font-bold tracking-tight", titleClassName)}>{title}</h2>
        <p className={cn("text-muted-foreground", descriptionClassName)}>{description}</p>
      </div>
      <Separator />
    </div>
  )
}
