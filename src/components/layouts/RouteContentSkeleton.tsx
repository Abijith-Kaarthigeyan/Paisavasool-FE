import React from "react"
import { KpiSkeleton, Skeleton, TableSkeleton } from "@/components/ui/skeleton"

export const RouteContentSkeleton: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl space-y-8 py-6 motion-reduce:animate-none animate-in fade-in duration-150">
      <div className="space-y-2 border-b border-border pb-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <KpiSkeleton />
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <TableSkeleton />
      </div>
    </div>
  )
}
