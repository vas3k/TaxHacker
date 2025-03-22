"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSidebar } from "@/components/ui/sidebar"
import Link from "next/link"

export default function MobileMenu({
  settings,
  unsortedFilesCount,
}: {
  settings: Record<string, string>
  unsortedFilesCount: number
}) {
  const { toggleSidebar } = useSidebar()

  return (
    <menu className="flex flex-row gap-2 p-2 items-center justify-between fixed top-0 left-0 w-full z-50 border-b-2 border-solid bg-background md:hidden">
      <Avatar className="h-10 w-10 rounded-lg cursor-pointer" onClick={toggleSidebar}>
        <AvatarImage src="/logo/256.png" />
        <AvatarFallback className="rounded-lg">AI</AvatarFallback>
      </Avatar>
      <Link href="/" className="text-lg font-bold">
        {settings.app_title}
      </Link>
      <Link
        href="/unsorted"
        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
      >
        {unsortedFilesCount}
      </Link>
    </menu>
  )
}
