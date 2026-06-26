import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DISPUTE_STATUS_VARIANT,
  PRIORITY_VARIANT,
  getStatusVariant,
} from "@/lib/design-tokens"
import { Calendar, ChevronLeft } from "lucide-react"
import type { Dispute } from "../../types"
import { getDisputePriorityKey } from "../../utils/disputeWorkspaceUtils"

interface DisputeWorkspaceHeaderProps {
  dispute: Dispute
}

export function DisputeWorkspaceHeader({ dispute }: DisputeWorkspaceHeaderProps) {
  const navigate = useNavigate()
  const priorityKey = getDisputePriorityKey(dispute)

  return (
    <header className="space-y-4 border-b border-border pb-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Back
        </Button>
        <span aria-hidden>/</span>
        <Link to="/disputes" className="hover:text-foreground">
          Disputes
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground">{dispute.dispute_number}</span>
      </div>

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
