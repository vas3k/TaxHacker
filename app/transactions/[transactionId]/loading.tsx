import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <Skeleton className="flex flex-row flex-wrap md:flex-nowrap justify-center items-start gap-10 p-5 bg-accent max-w-[1200px] min-h-[800px]" />
  )
}
