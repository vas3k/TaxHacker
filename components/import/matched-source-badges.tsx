import { CSVFormat } from "@/lib/csv/format-detector"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

type MatchedSourceBadgesProps = {
  csvFormat: CSVFormat | undefined
  transactionOriginalFormat: CSVFormat | undefined
}

const formatConfig: Record<CSVFormat, {
  label: string
  logo?: string
}> = {
  amazon: {
    label: "Amazon",
    logo: "/logos/amazon.png",
  },
  amex: {
    label: "Amex",
    logo: "/logos/amex.png",
  },
  chase: {
    label: "Chase",
    logo: "/logos/chase.png",
  },
  generic: {
    label: "CSV",
  }
}

export function MatchedSourceBadges({
  csvFormat,
  transactionOriginalFormat,
}: MatchedSourceBadgesProps) {
  // If no original format, just show CSV format
  if (!transactionOriginalFormat || transactionOriginalFormat === csvFormat) {
    if (!csvFormat) return null
    const config = formatConfig[csvFormat]
    if (!config.logo) return null

    return (
      <div className="flex items-center gap-1.5">
        <Image
          src={config.logo}
          alt={config.label}
          width={16}
          height={16}
          className="object-contain"
          title={config.label}
        />
      </div>
    )
  }

  // Show both logos when they're different
  const csvConfig = csvFormat ? formatConfig[csvFormat] : null
  const originalConfig = formatConfig[transactionOriginalFormat]

  return (
    <div className="flex items-center gap-1.5">
      {originalConfig.logo && (
        <Image
          src={originalConfig.logo}
          alt={originalConfig.label}
          width={16}
          height={16}
          className="object-contain"
          title={`Original: ${originalConfig.label}`}
        />
      )}
      <ArrowRight className="h-3 w-3 text-muted-foreground" />
      {csvConfig?.logo && (
        <Image
          src={csvConfig.logo}
          alt={csvConfig.label}
          width={16}
          height={16}
          className="object-contain"
          title={`Matched with: ${csvConfig.label}`}
        />
      )}
    </div>
  )
}
