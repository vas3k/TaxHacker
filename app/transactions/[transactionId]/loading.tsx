import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-wrap flex-row items-start justify-center gap-4 max-w-6xl">
      <Skeleton className="w-full h-[800px]" />
      <Skeleton className="w-1/3 max-w-[380px]" />
    </div>
  )
}
