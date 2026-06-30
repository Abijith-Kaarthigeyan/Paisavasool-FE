import { useSearchParams } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { buildDisputeDetailBreadcrumbs } from "../../utils/disputeBreadcrumbs"
import {
  DISPUTE_STATUS_VARIANT,
  PRIORITY_VARIANT,
  getStatusVariant,
} from "@/lib/design-tokens"
import { Calendar } from "lucide-react"
import type { Dispute } from "../../types"
import { getDisputePriorityKey } from "../../utils/disputeWorkspaceUtils"

interface DisputeWorkspaceHeaderProps {
  dispute: Dispute
}

export function DisputeWorkspaceHeader({ dispute }: DisputeWorkspaceHeaderProps) {
  const [searchParams] = useSearchParams()
  const priorityKey = getDisputePriorityKey(dispute)
  const breadcrumbItems = buildDisputeDetailBreadcrumbs(
    dispute.dispute_number,
    searchParams.get("from"),
    searchParams.get("fromLabel")
  )

  return (
    <header className="space-y-4 border-b border-border pb-5">
      <PageBreadcrumb items={breadcrumbItems} />

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="m-0 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {dispute.dispute_number}
          </h1>
          <Badge
            variant={getStatusVariant(DISPUTE_STATUS_VARIANT, dispute.status)}
            shape="pill"
          >
            {dispute.status.replace(/_/g, " ")}
          </Badge>
          <Badge variant="outline" shape="pill">
            {dispute.dispute_category}
          </Badge>
          <Badge
            variant={
              priorityKey === "N/A"
                ? "outline"
                : getStatusVariant(PRIORITY_VARIANT, priorityKey)
            }
            shape="pill"
          >
            Priority: {priorityKey}
          </Badge>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          Opened {new Date(dispute.created_at).toLocaleString()}
        </p>
      </div>
    </header>
  )
}
