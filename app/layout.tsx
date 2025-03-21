import ScreenDropArea from "@/components/files/screen-drop-area"
import MobileMenu from "@/components/sidebar/mobile-menu"
import { AppSidebar } from "@/components/sidebar/sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { getUnsortedFilesCount } from "@/data/files"
import { getSettings } from "@/data/settings"
import type { Metadata, Viewport } from "next"
import { NotificationProvider } from "./context"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    template: "%s | TaxHacker",
    default: "TaxHacker",
  },
  description: "Your personal AI accountant",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const unsortedFilesCount = await getUnsortedFilesCount()
  const settings = await getSettings()

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body>
        <NotificationProvider>
          <ScreenDropArea>
            <SidebarProvider>
              <MobileMenu settings={settings} unsortedFilesCount={unsortedFilesCount} />
              <AppSidebar settings={settings} unsortedFilesCount={unsortedFilesCount} />
              <SidebarInset className="w-full h-full mt-[60px] md:mt-0 overflow-auto">{children}</SidebarInset>
            </SidebarProvider>
            <Toaster />
          </ScreenDropArea>
        </NotificationProvider>
      </body>
    </html>
  )
}

export const dynamic = "force-dynamic"
