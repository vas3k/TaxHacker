import { SideNav } from "@/components/settings/side-nav"
import { Separator } from "@/components/ui/separator"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
  description: "Customize your settings here",
}

const settingsCategories = [
  {
    title: "General",
    href: "/settings",
  },
  {
    title: "Profile & Plan",
    href: "/settings/profile",
  },
  {
    title: "LLM settings",
    href: "/settings/llm",
  },
  {
    title: "Fields",
    href: "/settings/fields",
  },
  {
    title: "Categories",
    href: "/settings/categories",
  },
  {
    title: "Projects",
    href: "/settings/projects",
  },
  {
    title: "Currencies",
    href: "/settings/currencies",
  },
  {
    title: "Backups",
    href: "/settings/backups",
  },
  {
    title: "Danger Zone",
    href: "/settings/danger",
  },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="space-y-6 p-10 pb-16">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Customize your settings here</p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SideNav items={settingsCategories} />
          </aside>
          <div className="flex w-full">{children}</div>
        </div>
      </div>
    </>
  )
}
