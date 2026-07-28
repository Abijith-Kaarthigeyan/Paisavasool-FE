import React from "react"
import { formatSlaStatusLabel, isTerminalDisputeStatus } from "../utils/disputeFormatters"
import { cn } from "@/lib/utils"

interface SLAProgressProps {
  percentage: number
  isPaused?: boolean
  status?: string | null
  disputeStatus?: string | null
}

export const SLAProgress: React.FC<SLAProgressProps> = ({
  percentage,
  isPaused = false,
  status,
  disputeStatus,
}) => {
  const isClosed =
    isTerminalDisputeStatus(disputeStatus) || status === "CLOSED"

  const normPercent = Math.min(Math.max(percentage, 0), 100)

  let colorClass = "bg-success"
  let textClass = "text-success"
  let label = formatSlaStatusLabel(status || "ON_TRACK", isPaused, disputeStatus)

  if (isClosed) {
    colorClass = "bg-muted-foreground/40"
    textClass = "text-muted-foreground"
    label = "Closed"
  } else if (percentage >= 100 || status === "BREACHED") {
    colorClass = "bg-destructive"
    textClass = "text-destructive"
    label = formatSlaStatusLabel("BREACHED", isPaused, disputeStatus)
  } else if (percentage >= 80 || status === "AT_RISK") {
    colorClass = "bg-warning"
    textClass = "text-warning"
    label = formatSlaStatusLabel("AT_RISK", isPaused, disputeStatus)
  }

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className={cn(textClass)}>{label}</span>
        {!isClosed && (
          <span className="tabular-nums text-muted-foreground">{percentage.toFixed(0)}%</span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-300", colorClass)}
          style={{ width: isClosed ? "100%" : `${normPercent}%` }}
        />
      </div>
    </div>
  )
}

export default SLAProgress
