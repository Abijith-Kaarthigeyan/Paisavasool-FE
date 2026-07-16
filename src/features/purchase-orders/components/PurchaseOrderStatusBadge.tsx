import { Badge } from "@/components/ui/badge"
import { PO_STATUS_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import type { PurchaseOrderStatus } from "../types"

interface PurchaseOrderStatusBadgeProps {
  status: PurchaseOrderStatus | string
  className?: string
}

export function PurchaseOrderStatusBadge({
  status,
  className,
}: PurchaseOrderStatusBadgeProps) {
  return (
    <Badge
      variant={getStatusVariant(PO_STATUS_VARIANT, status)}
      shape="pill"
      className={className}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  )
}
