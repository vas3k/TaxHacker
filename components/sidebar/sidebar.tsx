"use client"

import { useNotification } from "@/app/(app)/context"
import { UploadButton } from "@/components/files/upload-button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { UserProfile } from "@/lib/auth"
import config from "@/lib/config"
import {
  ClockArrowUp,
  Coins,
  DatabaseBackup,
  FileText,
  FolderKanban,
  FormInput,
  Gift,
  House,
  Import,
  Sparkles,
  Tags,
  Upload,
  User,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { Blinker } from "./blinker"
import { SidebarMenuItemWithHighlight } from "./sidebar-item"
import SidebarUser from "./sidebar-user"

type SidebarApp = {
  id: string
  name: string
  icon: string
}

const settingsItems = [
  { title: "Profile & Plan", href: "/settings/profile", icon: User },
  { title: "LLM settings", href: "/settings/llm", icon: Sparkles },
  { title: "Fields", href: "/settings/fields", icon: FormInput },
  { title: "Categories", href: "/settings/categories", icon: Tags },
  { title: "Projects", href: "/settings/projects", icon: FolderKanban },
  { title: "Currencies", href: "/settings/currencies", icon: Coins },
  { title: "Backup & Restore", href: "/settings/backups", icon: DatabaseBackup },
]

export function AppSidebar({
  profile,
  unsortedFilesCount,
  isSelfHosted,
  apps,
}: {
  profile: UserProfile
  unsortedFilesCount: number
  isSelfHosted: boolean
  apps: SidebarApp[]
}) {
  const { open, setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const { notification } = useNotification()
  const accountTitle = profile.name || profile.email
  const accountSubtitle = isSelfHosted ? `Version ${config.app.version}` : profile.email

  // Hide sidebar on mobile when clicking an item
  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image src="/logo/256.png" alt="Logo" className="h-10 w-10 shrink-0 rounded-lg" width={40} height={40} />
            <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-base text-black">{accountTitle}</span>
              <span className="truncate text-xs text-muted-foreground">{accountSubtitle}</span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <UploadButton className="w-full mt-4 mb-2">
              <Upload className="h-4 w-4" />
              {open ? <span>Upload</span> : ""}
            </UploadButton>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItemWithHighlight href="/dashboard">
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard">
                      <House />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/transactions">
                  <SidebarMenuButton asChild>
                    <Link href="/transactions">
                      <FileText />
                      <span>Transactions</span>
                      {notification && notification.code === "sidebar.transactions" && notification.message && (
                        <Blinker />
                      )}
                      <span></span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/unsorted">
                  <SidebarMenuButton asChild>
                    <Link href="/unsorted">
                      <ClockArrowUp />
                      <span>Unsorted</span>
                      {unsortedFilesCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                          {unsortedFilesCount}
                        </span>
                      )}
                      {notification && notification.code === "sidebar.unsorted" && notification.message && <Blinker />}
                      <span></span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {apps.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Apps</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {apps.map((app) => (
                    <SidebarMenuItemWithHighlight key={app.id} href={`/apps/${app.id}`}>
                      <SidebarMenuButton asChild>
                        <Link href={`/apps/${app.id}`}>
                          <span className="text-base leading-none">{app.icon}</span>
                          <span>{app.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItemWithHighlight>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems.map((item) => (
                  <SidebarMenuItemWithHighlight key={item.href} href={item.href}>
                    <SidebarMenuButton asChild>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItemWithHighlight>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/import/csv">
                      <Import />
                      Import from CSV
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isSelfHosted && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="https://vas3k.com/donate/" target="_blank">
                        <Gift />
                        Thank the author
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {!open && (
                  <SidebarMenuItem>
                    <SidebarTrigger />
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {!isSelfHosted && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarUser profile={profile} isSelfHosted={isSelfHosted} />
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarFooter>
      </Sidebar>
    </>
  )
}
