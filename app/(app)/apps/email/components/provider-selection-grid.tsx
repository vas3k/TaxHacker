"use client"

import { EmailProvider } from "../page"
import { EMAIL_PROVIDER_PRESETS } from "../presets"

type ProviderSelectionGridProps = {
  onProviderSelect: (provider: EmailProvider) => void
}

export function ProviderSelectionGrid({ onProviderSelect }: ProviderSelectionGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
      {Object.entries(EMAIL_PROVIDER_PRESETS).map(([key, preset]) => (
        <button
          key={key}
          onClick={() => onProviderSelect(key as EmailProvider)}
          className="flex flex-col items-center p-6 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{preset.icon}</div>
          <div className="font-medium text-sm text-center text-gray-900 group-hover:text-blue-700">{preset.name}</div>
        </button>
      ))}
    </div>
  )
}
