import { Bot } from "lucide-react"

export default function ToolWindow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-2 border-purple-500 bg-purple-100 rounded-md overflow-hidden break-all">
      <div className="flex flex-row gap-1 items-center font-bold text-xs bg-purple-200 text-purple-800 p-1">
        <Bot className="w-4 h-4" />
        <span>{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
