import { Loader2 } from "lucide-react"

export default function AppLoading() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
    </div>
  )
}
