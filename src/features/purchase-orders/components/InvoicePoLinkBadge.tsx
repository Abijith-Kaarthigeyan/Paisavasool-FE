import { Link2, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type PoLinkState = "linked" | "awaiting_match" | "none"

export function getPoLinkState(invoice: {
  po_id?: string | null
  po_number?: string | null
}): PoLinkState {
  if (invoice.po_id) return "linked"
  if (invoice.po_number) return "awaiting_match"
  return "none"
}

interface InvoicePoLinkBadgeProps {
  poId?: string | null
  poNumber?: string | null
  compact?: boolean
  className?: string
}

export function InvoicePoLinkBadge({
  poId,
  poNumber,
  compact = false,
  className,
}: InvoicePoLinkBadgeProps) {
  const state = getPoLinkState({ po_id: poId, po_number: poNumber })

  if (state === "none") {
    return null
  }

  if (state === "linked") {
    return (
      <span
        className={cn("inline-flex items-center gap-1 text-success", className)}
        title="Linked to purchase order"
      >
        {!compact && (
          <Badge variant="success" shape="pill" className="gap-1 text-[10px]">
            <Link2 className="h-3 w-3" aria-hidden />
            Linked
          </Badge>
        )}
        {compact && <Link2 className="h-3.5 w-3.5" aria-hidden />}
      </span>
    )
  }

  return (
    <span
      className={cn("inline-flex items-center gap-1 text-warning", className)}
      title="PO referenced — awaiting match"
    >
      {!compact && (
        <Badge variant="warning" shape="pill" className="gap-1 text-[10px]">
          <Clock className="h-3 w-3" aria-hidden />
          Awaiting match
        </Badge>
      )}
      {compact && <Clock className="h-3.5 w-3.5" aria-hidden />}
    </span>
  )
}
