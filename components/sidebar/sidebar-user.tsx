import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { UserProfile } from "@/lib/auth"
import { authClient } from "@/lib/auth-client"
import { formatBytes } from "@/lib/utils"
import { HardDrive, LogOut, MoreVertical, User } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default function SidebarUser({ profile, isSelfHosted }: { profile: UserProfile; isSelfHosted: boolean }) {
  const signOut = async () => {
    await authClient.signOut({})
    redirect("/")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="default"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-6 w-6 rounded-full bg-sidebar-accent">
            <AvatarImage src={profile.avatar} alt={profile.name || ""} />
            <AvatarFallback className="rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span className="truncate font-medium">{profile.name || profile.email}</span>
          <MoreVertical className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side={"top"}
        align="center"
        sideOffset={4}
      >
        <DropdownMenuGroup>
          {/* <DropdownMenuItem>
            <ThemeToggle />
          </DropdownMenuItem> */}
          <DropdownMenuItem asChild>
            <Link href="/settings/profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile & Plan
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings/profile" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Storage: {formatBytes(profile.storageUsed)}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {!isSelfHosted && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <span onClick={signOut} className="flex items-center gap-2 text-red-600 cursor-pointer">
                <LogOut className="h-4 w-4" />
                Log out
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
