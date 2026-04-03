import { Badge } from "@/components/ui/badge"
import { CSVFormat } from "@/lib/csv/format-detector"
import { FileText } from "lucide-react"
import Image from "next/image"

type SourceBadgeProps = {
  format: CSVFormat
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

const formatConfig: Record<CSVFormat, {
  label: string
  logo?: string
  icon?: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}> = {
  amazon: {
    label: "Amazon Business",
    logo: "/logos/amazon.png",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200"
  },
  amex: {
    label: "American Express",
    logo: "/logos/amex.png",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200"
  },
  chase: {
    label: "Chase",
    logo: "/logos/chase.png",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50 border-indigo-200"
  },
  generic: {
    label: "CSV Import",
    icon: FileText,
    color: "text-gray-700",
    bgColor: "bg-gray-50 border-gray-200"
  }
}

export function SourceBadge({ format, size = "md", showLabel = true }: SourceBadgeProps) {
  const config = formatConfig[format]
  const Icon = config.icon

  const logoSizes = {
    sm: { width: 16, height: 16 },
    md: { width: 20, height: 20 },
    lg: { width: 24, height: 24 }
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  }

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  return (
    <Badge
      variant="outline"
      className={`${config.bgColor} ${config.color} gap-1.5 font-medium`}
    >
      {config.logo ? (
        <Image
          src={config.logo}
          alt={config.label}
          width={logoSizes[size].width}
          height={logoSizes[size].height}
          className="object-contain"
        />
      ) : Icon ? (
        <Icon className={iconSizes[size]} />
      ) : null}
      {showLabel && <span className={textSizes[size]}>{config.label}</span>}
    </Badge>
  )
}

export function getSourceLabel(format: CSVFormat): string {
  return formatConfig[format].label
}
