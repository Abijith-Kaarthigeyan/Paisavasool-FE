import { useCallback, useState } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/app/store"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { AiAgentCard } from "@/components/ui/ai-agent-card"
import {
  EditableRecommendedInvoiceForm,
  EditableInvoiceData,
} from "../EditableRecommendedInvoiceForm"
import { InvoiceAmendmentDiff } from "./InvoiceAmendmentDiff"
import { DisputeDecisionDialog, type DisputeDecisionKind } from "./DisputeDecisionDialog"
import {
  normalizeConfidence,
  parseRecommendationAction,
  canMutateEscalatedDispute,
} from "../../utils/disputeFormatters"
import { extractPaymentReference } from "../../utils/disputeWorkspaceUtils"
import { getInvoicePoContext } from "@/features/purchase-orders/utils/poInvoiceContext"
import type { Dispute, DisputeCase, DisputeEvidenceSnapshot, DisputeResolutionRecommendation } from "../../types"
import type { InvoiceItem } from "@/features/invoices/types"
import type { CustomerDetail } from "@/features/customers/types"
import type { DisputeActionState } from "../../utils/disputeWorkspaceUtils"

interface DisputeAttentionPanelProps {
  actionState: DisputeActionState
  dispute: Dispute
  disputeCase?: DisputeCase | null
  invoiceItems?: InvoiceItem[]
  customerDetail?: CustomerDetail | null
  evidence?: DisputeEvidenceSnapshot[]
  latestRecommendation: DisputeResolutionRecommendation | null
  latestAmendmentRecommendation: DisputeResolutionRecommendation | null
  onAssociateDecision: (decision: "APPROVE" | "REJECT", notes: string) => Promise<void>
  onEditAndApply: (invoice: EditableInvoiceData, notes: string) => Promise<void>
  onPaymentReviewDecision: (
    decision: "SETTLEMENT_DONE" | "SETTLEMENT_NOT_DONE",
    notes: string
  ) => Promise<void>
  onOperationalDecision: (
    decision: "ACKNOWLEDGED" | "REJECTED",
    notes: string
  ) => Promise<void>
  onEscalate?: (notes: string) => Promise<void>
}

function getAttentionCopy(actionState: DisputeActionState): { title: string; description: string } {
  if (actionState.isPaymentSettlementConfirmation || actionState.isWaitingPaymentReview) {
    return {
      title: "Needs your attention",
      description: "Confirm payment settlement with the reference and amount details below.",
    }
  }
  if (actionState.isWaitingOperationalReview) {
    return {
      title: "Needs your attention",
      description: "Acknowledge the internal team request to resume workflow execution.",
    }
  }
  return {
    title: "Needs your attention",
    description: "Review the AI recommendation and decide whether to approve, decline, or edit.",
  }
}

function PaymentContextInline({
  dispute,
  disputeCase,
  customerDetail,
  evidence = [],
}: {
  dispute: Dispute
  disputeCase?: DisputeCase | null
  customerDetail?: CustomerDetail | null
  evidence?: DisputeEvidenceSnapshot[]
}) {
  const invoice = dispute.invoice
  const caseBody = disputeCase?.raw_content || disputeCase?.email_body || ""
  const validationSnapshot = evidence.find(
    (e) =>
      e.snapshot_type.includes("VALIDATION") || e.snapshot_type.includes("PAYMENT")
  )
  const snapshotRef =
    validationSnapshot?.snapshot_data?.payment_reference ||
    validationSnapshot?.snapshot_data?.utr ||
    validationSnapshot?.snapshot_data?.reference
  const paymentRef = extractPaymentReference(
    String(snapshotRef ?? ""),
    caseBody,
    disputeCase?.email_subject
  )
  const recentPayment = (customerDetail?.payments ?? [])
    .slice()
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0]

  return (
    <div className="rounded-lg border border-border bg-background p-3 text-sm space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Payment context</p>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Invoice status</span>
        <Badge variant={invoice?.status === "PAID" ? "success" : "warning"} shape="pill">
          {invoice?.status === "PAID" ? "Paid" : "Unpaid / partial"}
        </Badge>
      </div>
      {paymentRef && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Reference / UTR</span>
          <span className="font-mono text-xs font-medium">{paymentRef}</span>
        </div>
      )}
      {recentPayment && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Latest payment</span>
          <span className="font-medium tabular-nums">
            ₹{recentPayment.payment_amount.toLocaleString()} ·{" "}
            {recentPayment.payment_reference || "No reference"}
          </span>
        </div>
      )}
    </div>
  )
}

export function DisputeAttentionPanel({
  actionState,
  dispute,
  disputeCase,
  invoiceItems = [],
  customerDetail,
  evidence = [],
  latestRecommendation,
  latestAmendmentRecommendation,
  onAssociateDecision,
  onEditAndApply,
  onPaymentReviewDecision,
  onOperationalDecision,
  onEscalate,
}: DisputeAttentionPanelProps) {
  const { user } = useSelector((state: RootState) => state.auth)
  const isEscalated = dispute.status === "ESCALATED"
  const canAssociateAction = canMutateEscalatedDispute(user?.role, dispute.status)

  const [decisionNotes, setDecisionNotes] = useState("")
  const [showEditApply, setShowEditApply] = useState(false)
  const [editedInvoice, setEditedInvoice] = useState<EditableInvoiceData | null>(null)
  const [pendingDecision, setPendingDecision] = useState<DisputeDecisionKind | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEditedInvoiceChange = useCallback((data: EditableInvoiceData) => {
    setEditedInvoice(data)
  }, [])

  const openConfirm = (decision: DisputeDecisionKind) => {
    setPendingDecision(decision)
    setIsConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!pendingDecision) return
    setIsSubmitting(true)
    try {
      switch (pendingDecision) {
        case "approve":
          await onAssociateDecision("APPROVE", decisionNotes)
          break
        case "reject":
          await onAssociateDecision("REJECT", decisionNotes)
          break
        case "settlement_done":
          await onPaymentReviewDecision("SETTLEMENT_DONE", decisionNotes)
          break
        case "settlement_not_done":
          await onPaymentReviewDecision("SETTLEMENT_NOT_DONE", decisionNotes)
          break
        case "acknowledge":
          await onOperationalDecision("ACKNOWLEDGED", decisionNotes)
          break
        case "operational_reject":
          await onOperationalDecision("REJECTED", decisionNotes)
          break
        case "edit_apply":
          if (editedInvoice) await onEditAndApply(editedInvoice, decisionNotes)
          break
        case "escalate":
          if (onEscalate) await onEscalate(decisionNotes)
          break
      }
      setIsConfirmOpen(false)
      setPendingDecision(null)
      setShowEditApply(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!actionState.hasPendingAction) return null

  const {
    isWaitingAssociateApproval,
    isWaitingPaymentReview,
    isWaitingOperationalReview,
    isPaymentSettlementConfirmation,
    isAmendmentDispute,
  } = actionState

  const attentionCopy = getAttentionCopy(actionState)
  const recForDisplay = latestRecommendation ?? latestAmendmentRecommendation
  const amendmentRec = latestAmendmentRecommendation
  const poContext = getInvoicePoContext(dispute.invoice)
  const linkedPoNumber =
    dispute.invoice?.purchase_order?.po_number ?? dispute.invoice?.po_number ?? null
  const parsed = recForDisplay
    ? parseRecommendationAction(recForDisplay.recommended_action)
    : null
  const confidence = recForDisplay ? normalizeConfidence(recForDisplay.confidence) : undefined

  const actionButtons = (
    <div className="flex flex-wrap gap-2">
      {isWaitingAssociateApproval && (
        <>
          {canAssociateAction && (
            <>
              <Button variant="success" size="sm" onClick={() => openConfirm("approve")}>
                {isPaymentSettlementConfirmation ? "Confirm settlement" : "Approve"}
              </Button>
              {isAmendmentDispute && amendmentRec?.recommended_invoice_json && (
                <Button variant="secondary" size="sm" onClick={() => setShowEditApply((v) => !v)}>
                  {showEditApply ? "Cancel edit" : "Edit & apply"}
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={() => openConfirm("reject")}>
                {isPaymentSettlementConfirmation ? "Settlement not confirmed" : "Decline"}
              </Button>
            </>
          )}
          {!isEscalated && user?.role === "FINANCE_ASSOCIATE" && (
            <Button variant="secondary" size="sm" onClick={() => openConfirm("escalate")}>
              Escalate to manager
            </Button>
          )}
        </>
      )}
      {isWaitingPaymentReview && (
        <>
          {canAssociateAction && (
            <>
              <Button variant="success" size="sm" onClick={() => openConfirm("settlement_done")}>
                Settlement done
              </Button>
              <Button variant="danger" size="sm" onClick={() => openConfirm("settlement_not_done")}>
                Settlement not done
              </Button>
            </>
          )}
          {!isEscalated && user?.role === "FINANCE_ASSOCIATE" && (
            <Button variant="secondary" size="sm" onClick={() => openConfirm("escalate")}>
              Escalate to manager
            </Button>
          )}
        </>
      )}
      {isWaitingOperationalReview && (
        <>
          {canAssociateAction && (
            <>
              <Button variant="primary" size="sm" onClick={() => openConfirm("acknowledge")}>
                Acknowledge
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/5"
                onClick={() => openConfirm("operational_reject")}
              >
                Reject
              </Button>
            </>
          )}
          {!isEscalated && user?.role === "FINANCE_ASSOCIATE" && (
            <Button variant="secondary" size="sm" onClick={() => openConfirm("escalate")}>
              Escalate to manager
            </Button>
          )}
        </>
      )}
    </div>
  )

  const showRecommendationCard =
    recForDisplay &&
    parsed &&
    isWaitingAssociateApproval &&
    !isPaymentSettlementConfirmation

  return (
    <>
      <Card className="border-warning/30 bg-warning-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-warning">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            {attentionCopy.title}
          </CardTitle>
          <CardDescription>{attentionCopy.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(isPaymentSettlementConfirmation || isWaitingPaymentReview) && (
            <PaymentContextInline
              dispute={dispute}
              disputeCase={disputeCase}
              customerDetail={customerDetail}
              evidence={evidence}
            />
          )}

          {showRecommendationCard && (
            <AiAgentCard
              agentName={recForDisplay.created_by_agent}
              stage={parsed.outcome}
              stageLabel="Suggested outcome"
              confidence={confidence}
              status="complete"
            >
              {parsed.reasoning && (
                <p className="text-sm leading-relaxed text-muted-foreground">{parsed.reasoning}</p>
              )}
              {isAmendmentDispute && poContext.hasLinkedPo && linkedPoNumber && (
                <p className="text-sm text-muted-foreground">
                  Resolution uses linked purchase order PO-{linkedPoNumber} as primary evidence.
                </p>
              )}
              {amendmentRec?.recommended_invoice_json && (
                <InvoiceAmendmentDiff
                  dispute={dispute}
                  invoiceItems={invoiceItems}
                  proposedInvoice={amendmentRec.recommended_invoice_json as Record<string, unknown>}
                  editedInvoice={showEditApply ? editedInvoice : null}
                />
              )}
            </AiAgentCard>
          )}

          {canAssociateAction ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="decision-notes">Decision notes</Label>
                <textarea
                  id="decision-notes"
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder={
                    isPaymentSettlementConfirmation || isWaitingPaymentReview
                      ? "Include settlement reference or notes…"
                      : "Include details explaining your decision…"
                  }
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>

              {actionButtons}
            </>
          ) : (
            <div className="rounded-lg border border-warning/50 bg-warning-muted/10 p-3.5 text-sm text-warning flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
              <div>
                <p className="font-semibold text-warning">Escalated to Manager</p>
                <p className="text-muted-foreground mt-0.5">
                  This dispute has been escalated to the manager. You will be notified once a manager reviews and resolves the issue.
                </p>
              </div>
            </div>
          )}

          {showEditApply && amendmentRec?.recommended_invoice_json && (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-medium text-muted-foreground">Edit invoice before applying</p>
              <EditableRecommendedInvoiceForm
                initialInvoice={
                  amendmentRec.recommended_invoice_json as Record<string, unknown>
                }
                onChange={handleEditedInvoiceChange}
              />
              {editedInvoice && (
                <InvoiceAmendmentDiff
                  dispute={dispute}
                  invoiceItems={invoiceItems}
                  proposedInvoice={amendmentRec.recommended_invoice_json as Record<string, unknown>}
                  editedInvoice={editedInvoice}
                />
              )}
              <Button
                size="sm"
                onClick={() => openConfirm("edit_apply")}
                disabled={!editedInvoice}
              >
                Submit edited amendment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <DisputeDecisionDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        decision={pendingDecision}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
      />
    </>
  )
}
