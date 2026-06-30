import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Percent } from "lucide-react"
import { cn } from "@/lib/utils"
import { widgetHoverLiftClass } from "@/lib/widget-styles"

export interface AssociatePerformanceRow {
  id: string
  name: string
  activeCases: number
  collectedAmount: number
  effectiveness: number
}

interface AssociatePerformanceWidgetProps {
  rows: AssociatePerformanceRow[]
  loading?: boolean
  className?: string
}

export const AssociatePerformanceWidget: React.FC<AssociatePerformanceWidgetProps> = ({
  rows,
  loading = false,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col rounded-lg border border-border bg-card p-4 shadow-card",
        widgetHoverLiftClass,
        className
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Associate performance</p>
            {loading ? (
              <Skeleton className="mt-2 h-10 w-14" />
            ) : (
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {rows.length}
              </p>
            )}
          </div>
          <Users className="h-5 w-5 text-[#2563EB]" aria-hidden />
        </div>

        {loading ? (
          <div className="mt-3 space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No direct reports yet.</p>
        ) : (
          <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-hidden">
            {rows.map((row) => (
              <li key={row.id} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate font-medium text-foreground">{row.name}</span>
                  <span
                    className={cn(
                      "ml-2 inline-flex shrink-0 items-center gap-0.5 font-semibold tabular-nums",
                      row.effectiveness >= 0.7
                        ? "text-success"
                        : row.effectiveness >= 0.4
                          ? "text-warning"
                          : "text-destructive"
                    )}
                  >
                    <Percent className="h-3 w-3" aria-hidden />
                    {(row.effectiveness * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{row.activeCases} active</span>
                  <span className="tabular-nums">
                    ₹{row.collectedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
