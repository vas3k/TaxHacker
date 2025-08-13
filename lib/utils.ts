import { clsx, type ClassValue } from "clsx"
import slugify from "slugify"
import { twMerge } from "tailwind-merge"
import { violet, tomato, red, crimson, pink, plum, purple, indigo, blue, sky, cyan, teal, mint, grass, lime, yellow, amber, orange, brown } from "@radix-ui/colors"

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
  const palette = [
    violet.violet9,
    indigo.indigo9,
    blue.blue9,
    cyan.cyan9,
    teal.teal9,
    grass.grass9,
    lime.lime9,
    yellow.yellow9,
    amber.amber9,
    orange.orange9,
    red.red9,
    crimson.crimson9,
    pink.pink9,
    purple.purple9,
    plum.plum9,
    mint.mint9,
    brown.brown9,
    sky.sky9,
    tomato.tomato9,
  ]
  return palette[Math.floor(Math.random() * palette.length)]
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

export function generateUUID(): string {
  // Try to use crypto.randomUUID() if available (modern browsers and Node.js 14.17+)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    try {
      return crypto.randomUUID()
    } catch (error) {
      // Fall through to next method
    }
  }

  // Fallback to crypto.getRandomValues() for UUID v4 generation
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    try {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)

      // Set version (4) and variant bits according to RFC 4122
      bytes[6] = (bytes[6] & 0x0f) | 0x40 // Version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80 // Variant 10

      // Convert to UUID string format
      const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
      return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32)].join("-")
    } catch (error) {
      // Fall through to Math.random() fallback
    }
  }

  // Final fallback using Math.random() (RFC 4122 compliant UUID v4)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function formatPeriodLabel(period: string, date: Date): string {
  if (period.includes("-") && period.split("-").length === 3) {
    // Daily format: show day/month/year
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } else {
    // Monthly format: show month/year with short month name
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    })
  }
}
