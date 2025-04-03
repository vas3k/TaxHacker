import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight flex flex-row gap-2">
          <Loader2 className="h-10 w-10 animate-spin" /> <span>Loading unsorted files...</span>
        </h2>
      </header>

      <Skeleton className="w-full h-[800px] flex flex-row flex-wrap md:flex-nowrap justify-center items-start gap-5 p-6">
        <Skeleton className="w-full h-full" />
        <div className="w-full flex flex-col gap-5">
          <Skeleton className="w-full h-12 mb-7" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="w-[120px] h-4" />
              <Skeleton className="w-full h-9" />
            </div>
          ))}
          <div className="flex flex-row justify-end gap-2 mt-2">
            <Skeleton className="w-[80px] h-9" />
            <Skeleton className="w-[130px] h-9" />
          </div>
        </div>
      </Skeleton>
    </div>
  )
}
