import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="w-full h-[350px]" />
    </div>
  )
}
