"use client"

import { useNotification } from "@/app/(app)/context"
import { UploadButton } from "@/components/files/upload-button"
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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
import { ClockArrowUp, FileText, Gift, House, Import, LayoutDashboard, Settings, Upload } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { ColoredText } from "../ui/colored-text"
import { Blinker } from "./blinker"
import { SidebarMenuItemWithHighlight } from "./sidebar-item"
import SidebarUser from "./sidebar-user"
import { useRouter } from "next/navigation";

export function AppSidebar({
  profile,
  unsortedFilesCount,
  isSelfHosted,
}: {
  profile: UserProfile
  unsortedFilesCount: number
  isSelfHosted: boolean
}) {
  const { open, setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const { notification, showNotification } = useNotification() as any
  const router = useRouter()
  const [manualProcessing, setManualProcessing] = useState(false)
  const [manualMessage, setManualMessage] = useState("")
  const [manualCount, setManualCount] = useState<number | null>(null);

  // Hide sidebar on mobile when clicking an item
  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchCount() {
      if (!isSelfHosted) return;
      const res = await fetch("/api/manual-upload/count");
      if (res.ok) {
        const data = await res.json();
        setManualCount(data.count ?? 0);
      }
    }
    fetchCount(); // initial load
    if (isSelfHosted) {
      interval = setInterval(fetchCount, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSelfHosted]);

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo/256.png" alt="Logo" className="h-10 w-10 rounded-lg" width={40} height={40} />
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-semibold text-lg">
                <ColoredText>{config.app.title}</ColoredText>
              </span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <UploadButton className="w-full mt-4 mb-2">
              <Upload className="h-4 w-4" />
              {open ? <span>Upload</span> : ""}
            </UploadButton>
            {isSelfHosted && (
              <Button
                className="w-full mb-2"
                disabled={manualProcessing}
                type="button"
                onClick={async () => {
                  setManualProcessing(true)
                  setManualMessage("")
                  try {
                    const res = await fetch("/api/manual-upload", { method: "POST" })
                    const data = await res.json()
                    if (data.success) {
                      setManualMessage(`Processed: ${data.processed?.join(", ") || "None"}`)
                      // mimic Upload button behavior
                      showNotification({ code: "sidebar.unsorted", message: "new" })
                      setTimeout(() => showNotification({ code: "sidebar.unsorted", message: "" }), 3000)
                      router.push("/unsorted")
                    } else {
                      setManualMessage(data.error || "Failed to process")
                    }
                    // refresh count after processing
                    const countRes = await fetch("/api/manual-upload/count");
                    if (countRes.ok) {
                      const countData = await countRes.json();
                      setManualCount(countData.count ?? 0);
                    }
                  } catch (err) {
                    setManualMessage("Failed to process (network error)")
                  }
                  setManualProcessing(false)
                }}
              >
                {manualProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {open ? (
                      <span>Process Manual Uploads{manualCount !== null ? ` (${manualCount})` : ""}</span>
                    ) : ""}
                  </>
                )}
              </Button>
            )}
            
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
                <SidebarMenuItemWithHighlight href="/apps">
                  <SidebarMenuButton asChild>
                    <Link href="/apps">
                      <LayoutDashboard />
                      <span>Apps</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
                <SidebarMenuItemWithHighlight href="/settings">
                  <SidebarMenuButton asChild>
                    <Link href="/settings">
                      <Settings />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
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
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarUser profile={profile} isSelfHosted={isSelfHosted} />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}
