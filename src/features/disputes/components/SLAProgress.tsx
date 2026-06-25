import React from "react"
import { formatSlaStatusLabel, isTerminalDisputeStatus } from "../utils/disputeFormatters"

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

  let colorClass = "bg-emerald-500"
  let textClass = "text-emerald-600 dark:text-emerald-400"
  let label = formatSlaStatusLabel(status || "ON_TRACK", isPaused, disputeStatus)

  if (isClosed) {
    colorClass = "bg-slate-400 dark:bg-slate-600"
    textClass = "text-slate-600 dark:text-slate-300"
    label = "Closed"
  } else if (percentage >= 100 || status === "BREACHED") {
    colorClass = "bg-rose-500"
    textClass = "text-rose-600 dark:text-rose-400"
    label = formatSlaStatusLabel("BREACHED", isPaused, disputeStatus)
  } else if (percentage >= 80 || status === "AT_RISK") {
    colorClass = "bg-amber-500"
    textClass = "text-amber-600 dark:text-amber-400"
    label = formatSlaStatusLabel("AT_RISK", isPaused, disputeStatus)
  }

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center text-[10px] font-bold">
        <span className={`${textClass} uppercase tracking-wider`}>{label}</span>
        {!isClosed && (
          <span className="text-muted-foreground font-mono">{percentage.toFixed(0)}%</span>
        )}
      </div>
      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: isClosed ? "100%" : `${normPercent}%` }}
        />
      </div>
    </div>
  )
}

export default SLAProgress;
