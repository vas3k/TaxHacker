import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
  description: "Customize your settings here",
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <div className="p-10 pb-16">{children}</div>
}
