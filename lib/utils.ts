import { clsx, type ClassValue } from "clsx"
import slugify from "slugify"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(total: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency,
  }).format(total / 100)
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
