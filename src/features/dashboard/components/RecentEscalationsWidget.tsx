import React from "react"
import { useNavigate } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle } from "lucide-react"
import { WidgetNavLink } from "./WidgetNavLink"
import { cn } from "@/lib/utils"
import type { CollectionCase } from "@/features/collections/types"

interface RecentEscalationsWidgetProps {
  escalations: CollectionCase[]
  loading?: boolean
  maxItems?: number
  className?: string
}

export const RecentEscalationsWidget: React.FC<RecentEscalationsWidgetProps> = ({
  escalations,
  loading = false,
  maxItems = 4,
  className,
}) => {
  const navigate = useNavigate()
  const items = escalations.slice(0, maxItems)

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col rounded-lg border border-border bg-card p-4 shadow-card",
        className
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Recent escalations</p>
            {loading ? (
              <Skeleton className="mt-2 h-10 w-14" />
            ) : (
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {escalations.length}
              </p>
            )}
          </div>
          <AlertTriangle className="h-5 w-5 text-[#DC2626]" aria-hidden />
        </div>

        {loading ? (
          <div className="mt-3 space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : items.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No escalated cases.</p>
        ) : (
          <ul className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-hidden">
            {items.map((esc) => {
              const outstanding =
                esc.invoice?.outstanding_amount ?? esc.outstanding_amount_snapshot
              return (
                <li key={esc.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/collections/${esc.id}`)}
                    className="flex w-full items-center justify-between rounded-md px-0.5 py-0.5 text-left text-xs transition-colors hover:text-primary"
                  >
                    <span className="truncate font-medium text-foreground">
                      {esc.customer?.customer_name ?? "Unknown customer"}
                    </span>
                    <span className="ml-2 shrink-0 tabular-nums text-muted-foreground">
                      ₹{outstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div className="shrink-0 px-1 pb-1 pt-2">
        <WidgetNavLink to="/disputes">View disputes</WidgetNavLink>
      </div>
    </div>
  )
}
