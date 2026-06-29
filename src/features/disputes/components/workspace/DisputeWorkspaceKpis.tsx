import { KpiCard, KpiGrid } from "@/components/ui/kpi-card"
import { SLAProgress } from "../SLAProgress"
import { DollarSign, Clock, User, Activity } from "lucide-react"
import type { Dispute } from "../../types"
import { computeDaysOpen } from "../../utils/disputeWorkspaceUtils"

interface DisputeWorkspaceKpisProps {
  dispute: Dispute
}

export function DisputeWorkspaceKpis({ dispute }: DisputeWorkspaceKpisProps) {
  const outstanding = dispute.invoice?.outstanding_amount
  const daysOpen = computeDaysOpen(dispute.created_at)

  return (
    <KpiGrid>
      <KpiCard
        label="Outstanding amount"
        value={
          outstanding != null
            ? `₹${outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            : "N/A"
        }
        icon={<DollarSign className="h-5 w-5" />}
        iconTone="destructive"
      />
      <KpiCard
        label="SLA status"
        value={
          dispute.sla ? (
            <SLAProgress
              percentage={dispute.sla.current_percentage}
              isPaused={dispute.sla.is_paused}
              status={dispute.sla.status}
              disputeStatus={dispute.status}
            />
          ) : (
            "No SLA"
          )
        }
        icon={<Activity className="h-5 w-5" />}
        iconTone={
          dispute.status === "ESCALATED" || dispute.sla?.status === "BREACHED"
            ? "destructive"
            : dispute.sla?.status === "AT_RISK"
              ? "warning"
              : "success"
        }
      />
      <KpiCard
        label="Days open"
        value={daysOpen}
        icon={<Clock className="h-5 w-5" />}
        iconTone="info"
      />
      <KpiCard
        label="Assigned associate"
        value={dispute.assigned_user_name || "Unassigned"}
        icon={<User className="h-5 w-5" />}
        iconTone="default"
      />
    </KpiGrid>
  )
}
