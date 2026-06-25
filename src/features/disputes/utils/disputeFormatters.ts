import type { DisputeCommunication, DisputeReviewQueueItem } from "../types"

const TERMINAL_DISPUTE_STATUSES = new Set(["CLOSED", "RESOLVED", "FAILED"])

export function isTerminalDisputeStatus(status?: string | null): boolean {
  return !!status && TERMINAL_DISPUTE_STATUSES.has(status)
}

export function normalizeConfidence(confidence: number): number {
  let pct = confidence
  if (pct <= 1) {
    pct *= 100
  } else if (pct > 100) {
    pct /= 100
  }
  return Math.min(100, Math.max(0, pct))
}

export function formatConfidencePercent(confidence: number): string {
  return `${normalizeConfidence(confidence).toFixed(2)}%`
}

export function getReviewQueueDisplayConfidence(item: DisputeReviewQueueItem): number {
  const reason = (item.review_reason || "").toUpperCase()
  if (reason.includes("LOW_CONFIDENCE")) return 68
  if (reason.includes("VALIDATION")) return 55
  if (reason.includes("INVOICE_MISSING")) return 50
  if (reason.includes("INVOICE_CANCELLED")) return 45
  return 68
}

export function parseRecommendationAction(action: string): {
  outcome: string
  reasoning: string
} {
  const match = action.match(/^AMENDMENT_DECISION:\s*([A-Z_]+)\.\s*Reason:\s*(.*)$/s)
  if (match) {
    return { outcome: match[1].replace(/_/g, " "), reasoning: match[2].trim() }
  }
  return { outcome: action, reasoning: "" }
}

export function formatSlaStatusLabel(
  status?: string | null,
  isPaused?: boolean,
  disputeStatus?: string | null
): string {
  if (isTerminalDisputeStatus(disputeStatus) || status === "CLOSED") {
    return "Closed"
  }
  if (!status) return "No SLA"
  const label = status.replace(/_/g, " ")
  return isPaused ? `${label} (Paused)` : label
}

export function getCommunicationDirection(
  comm: DisputeCommunication
): "Sent" | "Received" {
  if (comm.communication_type === "INTERNAL") {
    return "Sent"
  }
  const subject = (comm.subject || "").toLowerCase()
  if (
    subject.includes("paisa vasool") ||
    subject.includes("escalation request")
  ) {
    return "Sent"
  }
  return "Received"
}

export function getCommunicationAddress(
  comm: DisputeCommunication,
  customerEmail?: string | null
): string {
  const direction = getCommunicationDirection(comm)
  if (comm.communication_type === "INTERNAL") {
    return comm.recipient
  }
  if (direction === "Sent") {
    return comm.recipient
  }
  return customerEmail || comm.recipient
}

export function getCommunicationTypeLabel(comm: DisputeCommunication): string {
  if (comm.communication_type === "INTERNAL") {
    return "Internal"
  }
  return "Customer"
}
