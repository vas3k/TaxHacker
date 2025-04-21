import ScreenDropArea from "@/components/files/screen-drop-area"
import MobileMenu from "@/components/sidebar/mobile-menu"
import { AppSidebar } from "@/components/sidebar/sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { getCurrentUser } from "@/lib/auth"
import config from "@/lib/config"
import { getUnsortedFilesCount } from "@/models/files"
import type { Metadata, Viewport } from "next"
import "../globals.css"
import { NotificationProvider } from "./context"

export const metadata: Metadata = {
  title: {
    template: "%s | TaxHacker",
    default: config.app.title,
  },
  description: config.app.description,
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
  const user = await getCurrentUser()
  const unsortedFilesCount = await getUnsortedFilesCount(user.id)

  const userProfile = {
    id: user.id,
    name: user.name || "",
    email: user.email,
    avatar: user.avatar || undefined,
    storageUsed: user.storageUsed || 0,
    storageLimit: user.storageLimit || -1,
    tokenBalance: user.tokenBalance || 0,
  }

  return (
    <NotificationProvider>
      <ScreenDropArea>
        <SidebarProvider>
          <MobileMenu unsortedFilesCount={unsortedFilesCount} />
          <AppSidebar
            profile={userProfile}
            unsortedFilesCount={unsortedFilesCount}
            isSelfHosted={config.selfHosted.isEnabled}
          />
          <SidebarInset className="w-full h-full mt-[60px] md:mt-0 overflow-auto">{children}</SidebarInset>
        </SidebarProvider>
        <Toaster />
      </ScreenDropArea>
    </NotificationProvider>
  )
}

export const dynamic = "force-dynamic"
