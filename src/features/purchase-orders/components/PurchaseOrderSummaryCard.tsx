import { Link } from "react-router-dom"
import { Calendar, ExternalLink } from "lucide-react"
import { formatCurrency } from "@/lib/formatCurrency"
import { cn } from "@/lib/utils"
import { PurchaseOrderStatusBadge } from "./PurchaseOrderStatusBadge"
import type { PurchaseOrderSummary } from "../types"

interface PurchaseOrderSummaryCardProps {
  purchaseOrder: PurchaseOrderSummary
  showViewLink?: boolean
  /** Horizontal layout for full-width cards (e.g. under line items). */
  layout?: "default" | "wide"
}

export function PurchaseOrderSummaryCard({
  purchaseOrder,
  showViewLink = true,
  layout = "default",
}: PurchaseOrderSummaryCardProps) {
  if (layout === "wide") {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-8 gap-y-3 text-sm">
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs text-muted-foreground">PO number</p>
            <p className="font-semibold text-foreground">#{purchaseOrder.po_number}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">PO date</p>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              {new Date(purchaseOrder.po_date).toLocaleDateString()}
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-medium tabular-nums text-foreground">
              {formatCurrency(purchaseOrder.total_amount)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Status</p>
            <PurchaseOrderStatusBadge status={purchaseOrder.status} />
          </div>
        </div>
        {showViewLink && (
          <Link
            to={`/purchase-orders/${purchaseOrder.id}`}
            className={cn(
              "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-border",
              "bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            )}
          >
            View PO
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">PO #{purchaseOrder.po_number}</p>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {new Date(purchaseOrder.po_date).toLocaleDateString()}
          </div>
        </div>
        <PurchaseOrderStatusBadge status={purchaseOrder.status} />
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Total</span>
        <span className="font-medium tabular-nums text-foreground">
          {formatCurrency(purchaseOrder.total_amount)}
        </span>
      </div>
      {showViewLink && (
        <Link
          to={`/purchase-orders/${purchaseOrder.id}`}
          className={cn(
            "inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-border",
            "bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          )}
        >
          View PO
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </div>
  )
}
