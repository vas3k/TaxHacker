import { clsx, type ClassValue } from "clsx"
import slugify from "slugify"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(total: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(total / 100)
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes"

  const sizes = ["Bytes", "KB", "MB", "GB"]
  const maxIndex = sizes.length - 1

  const i = Math.min(Math.floor(Math.log10(bytes) / Math.log10(1024)), maxIndex)
  const value = bytes / Math.pow(1024, i)

  return `${parseFloat(value.toFixed(2))} ${sizes[i]}`
}

export function codeFromName(name: string, maxLength: number = 16) {
  const code = slugify(name, {
    replacement: "_",
    lower: true,
    strict: true,
    trim: true,
  })
  return code.slice(0, maxLength)
}

export function randomHexColor() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16)
}
