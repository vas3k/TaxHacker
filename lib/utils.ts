import { clsx, type ClassValue } from "clsx"
import slugify from "slugify"
import { twMerge } from "tailwind-merge"

const LOCALE = "en-US"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(total: number, currency: string) {
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(total / 100)
  } catch (error) {
    // can happen with custom currencies and crypto
    return `${currency} ${total / 100}`
  }
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes"

  const sizes = ["Bytes", "KB", "MB", "GB"]
  const maxIndex = sizes.length - 1

  const i = Math.min(Math.floor(Math.log10(bytes) / Math.log10(1024)), maxIndex)
  const value = bytes / Math.pow(1024, i)

  return `${parseFloat(value.toFixed(2))} ${sizes[i]}`
}

export function formatNumber(number: number) {
  return new Intl.NumberFormat(LOCALE, {
    useGrouping: true,
  }).format(number)
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

export async function fetchAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const blob = await response.blob()

    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("Error fetching image as data URL:", error)
    return null
  }
}

export function encodeFilename(filename: string): string {
  const encoded = encodeURIComponent(filename)
  return `UTF-8''${encoded}`
}
