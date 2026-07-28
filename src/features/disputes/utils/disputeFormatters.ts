import type { CaseAttachment, DisputeCommunication, DisputeReviewQueueItem } from "../types"

const TERMINAL_DISPUTE_STATUSES = new Set(["CLOSED", "RESOLVED", "FAILED"])

const ASSOCIATE_INPUT_STATUSES = new Set([
  "WAITING_ASSOCIATE_APPROVAL",
  "IN_REVIEW",
  "WAITING_PAYMENT_REVIEW",
])

const WAITING_INTERNAL_TEAM_STATUSES = new Set(["WAITING_INTERNAL", "WAITING_INTERNAL_TEAM"])

export function isClosedDispute(status?: string | null): boolean {
  return status === "CLOSED"
}

export function isFailedDispute(status?: string | null): boolean {
  return status === "FAILED"
}

/** Active open disputes — everything except closed and failed. */
export function isNonClosedDispute(dispute: { status?: string | null }): boolean {
  return !isClosedDispute(dispute.status) && !isFailedDispute(dispute.status)
}

/** Disputes waiting on associate approval, payment review, or similar action. */
export function needsAssociateInput(dispute: { status?: string | null }): boolean {
  return !!dispute.status && ASSOCIATE_INPUT_STATUSES.has(dispute.status)
}

/** Disputes blocked on an internal department response. */
export function isWaitingInternalTeamDispute(dispute: { status?: string | null }): boolean {
  return !!dispute.status && WAITING_INTERNAL_TEAM_STATUSES.has(dispute.status)
}

export function isTerminalDisputeStatus(status?: string | null): boolean {
  return !!status && TERMINAL_DISPUTE_STATUSES.has(status)
}

/** Disputes in the escalated queue: manually escalated or SLA-breached, still active. */
export function isEscalatedDispute(dispute: {
  status?: string | null
  sla?: { status?: string | null } | null
}): boolean {
  return (
    (dispute.status === "ESCALATED" || dispute.sla?.status === "BREACHED") &&
    !isTerminalDisputeStatus(dispute.status)
  )
}

/**
 * Associates cannot change status once escalated; managers/admins can still act.
 */
export function canMutateEscalatedDispute(
  role: string | null | undefined,
  status: string | null | undefined
): boolean {
  if (status !== "ESCALATED") return true
  return role === "FINANCE_MANAGER" || role === "ADMIN"
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

const REASONING_JARGON_REPLACEMENTS: Array<[RegExp, string]> = [
  [/invoice JSON provided by the company/gi, "invoice on file"],
  [/JSON provided by the company/gi, "company records"],
  [/invoice JSON/gi, "invoice on file"],
  [/the JSON/gi, "the system records"],
  [/\bJSON\b/g, "system records"],
]

/** Strips technical jargon from AI reasoning before showing it in the UI. */
export function formatReasoningForDisplay(reasoning: string): string {
  let result = reasoning.trim()
  for (const [pattern, replacement] of REASONING_JARGON_REPLACEMENTS) {
    result = result.replace(pattern, replacement)
  }
  return result
}

export function parseRecommendationAction(action: string): {
  outcome: string
  reasoning: string
} {
  const match = action.match(
    /^(?:AMENDMENT_DECISION|QUALITY_DECISION|LATE_DELIVERY_DECISION):\s*([A-Z_]+)\.\s*Reason:\s*(.*)$/s
  )
  if (match) {
    return {
      outcome: match[1].replace(/_/g, " "),
      reasoning: formatReasoningForDisplay(match[2]),
    }
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
  const showPaused = isPaused && !isTerminalDisputeStatus(disputeStatus)
  return showPaused ? `${label} (Paused)` : label
}

export function isCaseOriginCommunication(comm: DisputeCommunication): boolean {
  return comm.id.startsWith("case-")
}

/** Filenames listed under a compose-reply Attachments section in outbound bodies. */
export function extractComposeAttachmentFilenamesFromBody(body: string): string[] {
  const match = body.match(/\nAttachments:\s*\n([\s\S]*?)(?:\n\n|$)/i)
  if (!match) return []
  return match[1]
    .split("\n")
    .map((line) => line.replace(/^\s*[-•]\s*/, "").trim())
    .filter(Boolean)
}

export function messageHasComposeAttachmentList(body: string): boolean {
  return extractComposeAttachmentFilenamesFromBody(body).length > 0
}

/** Pulls the EMAIL BODY section out of normalized intake content (SUBJECT / EMAIL BODY / ATTACHMENT). */
export function extractEmailBodySection(body: string): string {
  const match = body.match(/\bEMAIL BODY:\s*\n([\s\S]*?)(?:\n\nATTACHMENT CONTENT:|\n*ATTACHMENT CONTENT:|\s*$)/i)
  return match ? match[1].trim() : body
}

/** Removes extracted attachment text from normalized email bodies for UI display only. */
export function formatCommunicationBodyForDisplay(body: string): string {
  if (!body.trim()) return body
  const withoutAttachments = body
    .replace(/\n*\s*ATTACHMENT\s+CONTENT:\s*[\s\S]*$/i, "")
    .replace(/\n*\s*Attachments:\s*\n[\s\S]*$/i, "")
    .trimEnd()
  const emailBody = extractEmailBodySection(withoutAttachments)
  return stripQuotedReplyContent(emailBody)
}

export function messageHasAttachmentContent(body: string): boolean {
  return /ATTACHMENT\s+CONTENT:/i.test(body) || messageHasComposeAttachmentList(body)
}

/** Filenames embedded in normalized email bodies, e.g. ATTACHMENT 1 (file.pdf): */
export function extractAttachmentFilenamesFromBody(body: string): string[] {
  const pattern = /ATTACHMENT\s+\d+\s*\(([^)]+)\)\s*:/gi
  const filenames: string[] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body)) !== null) {
    const filename = match[1].trim()
    if (filename) {
      filenames.push(filename)
    }
  }
  return filenames
}

function normalizeFilenameForMatch(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[_\-\s]+/g, "")
}

/** Matches stored attachment names to body-embedded filenames, including shorthand variants. */
export function filenamesMatch(storedFilename: string, bodyFilename: string): boolean {
  const stored = normalizeFilenameForMatch(storedFilename)
  const body = normalizeFilenameForMatch(bodyFilename)
  if (stored === body) return true
  return stored.includes(body) || body.includes(stored)
}

/** Resolves which attachments belong to a single thread message. */
export function resolveMessageAttachments(
  body: string,
  caseAttachments: CaseAttachment[]
): CaseAttachment[] {
  const bodyFilenames = [
    ...extractAttachmentFilenamesFromBody(body),
    ...extractComposeAttachmentFilenamesFromBody(body),
  ]

  if (bodyFilenames.length === 0) return []

  if (caseAttachments.length > 0) {
    const matched = caseAttachments.filter((attachment) =>
      bodyFilenames.some((filename) => filenamesMatch(attachment.filename, filename))
    )
    if (matched.length > 0) return matched
  }

  return bodyFilenames.map((filename, index) => ({
    id: `body-attachment-${index}`,
    filename,
    mime_type: "application/pdf",
    created_at: "",
  }))
}

/** Strips quoted prior messages so only the newly written reply text remains. */
export function stripQuotedReplyContent(body: string): string {
  if (!body.trim()) return body

  // Gmail / Apple Mail: "On Thu, 2 Jul 2026 at 19:41, <email> wrote:" (optional leading _)
  const onWroteMatch = body.match(/(^|\n)\s*_?On .+? wrote:_?\s*/i)
  if (onWroteMatch?.index !== undefined) {
    return body.slice(0, onWroteMatch.index).trim()
  }

  const originalMessageIndex = body.search(/(^|\n)-{2,}\s*Original Message\s*-{2,}/i)
  if (originalMessageIndex >= 0) {
    return body.slice(0, originalMessageIndex).trim()
  }

  const outlookReplyIndex = body.search(/(^|\n)From:\s*.+\nSent:\s*.+\nTo:\s*/i)
  if (outlookReplyIndex >= 0) {
    return body.slice(0, outlookReplyIndex).trim()
  }

  const forwardedIndex = body.search(/(^|\n)-{5,}\s*Forwarded message\s*-{5,}/i)
  if (forwardedIndex >= 0) {
    return body.slice(0, forwardedIndex).trim()
  }

  const lines = body.split("\n")
  const firstQuoteLine = lines.findIndex((line) => line.trimStart().startsWith(">"))
  if (firstQuoteLine > 0) {
    return lines.slice(0, firstQuoteLine).join("\n").trim()
  }

  return body.trim()
}

function getCommunicationBodyText(comm: DisputeCommunication): string {
  return comm.message_body || (comm as { body?: string }).body || ""
}

export function getCommunicationDirection(
  comm: DisputeCommunication,
  options?: { isCaseOrigin?: boolean }
): "Sent" | "Received" {
  if (options?.isCaseOrigin || isCaseOriginCommunication(comm)) {
    return "Received"
  }
  if (comm.communication_type === "ASSOCIATE_OUTBOUND") {
    return "Sent"
  }
  if (comm.communication_type === "INTERNAL") {
    return "Sent"
  }
  // AI/system outbound customer emails are persisted as CUSTOMER and get a Gmail id after send.
  if (comm.communication_type === "CUSTOMER" && comm.gmail_message_id) {
    return "Sent"
  }

  const subject = (comm.subject || "").toLowerCase()
  const body = stripQuotedReplyContent(getCommunicationBodyText(comm)).toLowerCase()
  const outboundMarkers = [
    "paisa vasool",
    "escalation request",
    "dear customer",
    "we have received your",
    "please find attached",
    "regarding your dispute",
  ]
  if (outboundMarkers.some((m) => subject.includes(m) || body.includes(m))) {
    return "Sent"
  }
  return "Received"
}

export function getCommunicationAddress(
  comm: DisputeCommunication,
  customerEmail?: string | null,
  options?: { isCaseOrigin?: boolean }
): string {
  const direction = getCommunicationDirection(comm, options)
  if (comm.communication_type === "INTERNAL") {
    return comm.recipient
  }
  if (direction === "Sent") {
    return comm.recipient
  }
  return customerEmail || comm.recipient
}

export function isInternalCommunication(comm: DisputeCommunication): boolean {
  return comm.communication_type === "INTERNAL"
}

export function getCommunicationTypeLabel(comm: DisputeCommunication): string {
  if (comm.communication_type === "ASSOCIATE_OUTBOUND") {
    return "Associate"
  }
  if (comm.communication_type === "INTERNAL") {
    return "Internal"
  }
  return "Customer"
}

export function isAssociateOutboundCommunication(comm: DisputeCommunication): boolean {
  return comm.communication_type === "ASSOCIATE_OUTBOUND"
}

export function getCommunicationPreview(body: string, maxLines = 2): string {
  const lines = body.split("\n").filter((line) => line.trim())
  if (lines.length <= maxLines) return body.trim()
  return lines.slice(0, maxLines).join("\n") + "…"
}

export function isOutboundCommunication(comm: DisputeCommunication): boolean {
  return (
    comm.communication_type === "ASSOCIATE_OUTBOUND" ||
    comm.communication_type === "INTERNAL" ||
    getCommunicationDirection(comm) === "Sent"
  )
}

export function isCommunicationDelivered(comm: DisputeCommunication): boolean {
  return isOutboundCommunication(comm) && !!comm.gmail_message_id
}

export function getCommunicationDeliveryLabel(comm: DisputeCommunication): string | null {
  if (!isOutboundCommunication(comm)) {
    return null
  }
  return isCommunicationDelivered(comm) ? "Delivered" : "Saved (delivery pending)"
}
