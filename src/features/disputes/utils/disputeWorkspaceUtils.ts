import type { Dispute, DisputeWorkflowContext } from "../types"

export function isPaymentDisputeCategory(category: string): boolean {
  return ["PAYMENT_ALREADY_DONE", "PAYMENT_NOT_REFLECTED", "SHORT_PAYMENT"].includes(category)
}

export function computeDaysOpen(createdAt: string): number {
  const opened = new Date(createdAt).getTime()
  const now = Date.now()
  return Math.max(0, Math.floor((now - opened) / (1000 * 60 * 60 * 24)))
}

export function getDisputePriorityKey(dispute: Dispute): string {
  if (!dispute.sla) return "N/A"
  if (dispute.sla.status === "BREACHED") return "HIGH"
  if (dispute.sla.status === "AT_RISK") return "MEDIUM"
  return "LOW"
}

export interface DisputeActionState {
  currentNode: string
  isWaitingAssociateApproval: boolean
  isWaitingPaymentReview: boolean
  isWaitingOperationalReview: boolean
  isPaymentCategory: boolean
  isPaymentSettlementConfirmation: boolean
  isAmendmentDispute: boolean
  hasPendingAction: boolean
}

export function getDisputeActionState(
  dispute: Dispute,
  wfContext?: DisputeWorkflowContext | null
): DisputeActionState {
  const currentNode = wfContext?.current_node || ""
  const isWaitingAssociateApproval =
    currentNode === "waiting_approval_node" ||
    dispute.status === "WAITING_ASSOCIATE_APPROVAL" ||
    dispute.status === "IN_REVIEW"
  const isWaitingPaymentReview =
    dispute.status === "WAITING_PAYMENT_REVIEW" ||
    (currentNode === "waiting_resolution_node" &&
      (dispute.status === "WAITING_PAYMENT_REVIEW" ||
        dispute.dispute_category === "SHORT_PAYMENT"))
  const isWaitingOperationalReview =
    dispute.status === "WAITING_INTERNAL_TEAM" ||
    (currentNode === "waiting_resolution_node" &&
      (dispute.status === "WAITING_INTERNAL_TEAM" ||
        dispute.dispute_category !== "SHORT_PAYMENT"))
  const isPaymentCategory = ["PAYMENT_ALREADY_DONE", "PAYMENT_NOT_REFLECTED"].includes(
    dispute.dispute_category
  )
  const isPaymentSettlementConfirmation = isWaitingAssociateApproval && isPaymentCategory
  const isAmendmentDispute =
    dispute.dispute_category === "AMENDMENT" && !isPaymentSettlementConfirmation

  return {
    currentNode,
    isWaitingAssociateApproval,
    isWaitingPaymentReview,
    isWaitingOperationalReview,
    isPaymentCategory,
    isPaymentSettlementConfirmation,
    isAmendmentDispute,
    hasPendingAction:
      isWaitingAssociateApproval || isWaitingPaymentReview || isWaitingOperationalReview,
  }
}

export function extractPaymentReference(...texts: (string | null | undefined)[]): string | null {
  for (const text of texts) {
    if (!text) continue
    const utrMatch = text.match(/\bUTR[:\s-]*([A-Z0-9]{8,22})\b/i)
    if (utrMatch) return utrMatch[1]
    const refMatch = text.match(/\b(?:ref(?:erence)?|txn|transaction)[:\s#-]*([A-Z0-9]{6,22})\b/i)
    if (refMatch) return refMatch[1]
  }
  return null
}
