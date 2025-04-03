import type { Metadata, Viewport } from "next"
import "./globals.css"
import { APP_DESCRIPTION, APP_TITLE } from "@/lib/constants"

export const metadata: Metadata = {
  title: {
    template: "%s | TaxHacker",
    default: APP_TITLE,
  },
  description: APP_DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body>{children}</body>
    </html>
  )
}
