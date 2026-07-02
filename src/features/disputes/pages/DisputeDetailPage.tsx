import React, { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import {
  useCreateComment,
  useAssociateDecision,
  usePaymentReviewDecision,
  useOperationalDecision,
  useDraftDisputeCommunication,
  useSendDisputeCommunication,
  useLatestCommunicationDraft,
  useEscalateDispute,
  useCloseDispute,
} from "../hooks/useDisputes"
import { useDisputeWorkspace } from "../hooks/useDisputeWorkspace"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/toast"
import { AlertTriangle, MessageSquare } from "lucide-react"
import { EditableInvoiceData } from "../components/EditableRecommendedInvoiceForm"
import { DisputeWorkspaceHeader } from "../components/workspace/DisputeWorkspaceHeader"
import { DisputeWorkspaceKpis } from "../components/workspace/DisputeWorkspaceKpis"
import { DisputeAttentionPanel } from "../components/workspace/DisputeAttentionPanel"
import { DisputeCustomerCard } from "../components/workspace/DisputeContextRail"
import { DisputeOverviewTab } from "../components/workspace/DisputeOverviewTab"
import { DisputeInvoicePaymentTab } from "../components/workspace/DisputeInvoicePaymentTab"
import { DisputeCommunicationsSheet } from "../components/workspace/DisputeCommunicationsSheet"
import { DisputeComposePane } from "../components/workspace/DisputeComposePane"
import { DisputeCommentsTab } from "../components/workspace/DisputeCommentsTab"
import { DisputeRecommendationsTab } from "../components/workspace/DisputeRecommendationsTab"
import { DisputeActivityTab } from "../components/workspace/DisputeActivityTab"
import { DisputeCloseDialog } from "../components/workspace/DisputeCloseDialog"
import type { AssociateCommunicationSendPayload, DisputeClosePayload } from "../types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

import { getDisputeActionState, getCommunicationsAttentionState } from "../utils/disputeWorkspaceUtils"
import { isNonClosedDispute } from "../utils/disputeFormatters"

export const DisputeDetailPage: React.FC = () => {
  const { disputeId } = useParams<{ disputeId: string }>()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [isCommsPanelOpen, setIsCommsPanelOpen] = useState(false)
  const [isComposePaneOpen, setIsComposePaneOpen] = useState(false)
  const attentionRef = useRef<HTMLDivElement>(null)

  const workspace = useDisputeWorkspace(disputeId || "")
  const {
    dispute,
    disputeCase,
    caseAttachments,
    activities,
    comments,
    recommendations,
    allCommunications,
    evidence,
    wfContext,
    invoiceItems,
    customerDetail,
    customerEmail,
    latestRecommendation,
    latestAmendmentRecommendation,
    isLoading,
    isError,
    refetchDispute,
    loading,
  } = workspace

  const commentMutation = useCreateComment()
  const associateDecisionMutation = useAssociateDecision()
  const paymentReviewMutation = usePaymentReviewDecision()
  const operationalDecisionMutation = useOperationalDecision()
  const escalateDisputeMutation = useEscalateDispute()
  const closeDisputeMutation = useCloseDispute()
  const draftCommunicationMutation = useDraftDisputeCommunication(disputeId || "")
  const sendCommunicationMutation = useSendDisputeCommunication(disputeId || "")
  const [isCloseOpen, setIsCloseOpen] = useState(false)

  const latestCustomerCommId = useMemo(() => {
    const customerComms = allCommunications.filter(
      (comm) => comm.communication_type === "CUSTOMER"
    )
    return customerComms.length > 0 ? customerComms[customerComms.length - 1].id : null
  }, [allCommunications])

  const prevCustomerCommIdRef = useRef<string | null>(null)
  const [pollForInboundDraft, setPollForInboundDraft] = useState(false)

  useEffect(() => {
    if (
      latestCustomerCommId &&
      prevCustomerCommIdRef.current &&
      latestCustomerCommId !== prevCustomerCommIdRef.current
    ) {
      setPollForInboundDraft(true)
    }
    prevCustomerCommIdRef.current = latestCustomerCommId
  }, [latestCustomerCommId])

  const { data: latestCommunicationDraft } = useLatestCommunicationDraft(disputeId || "", {
      pollForInboundDraft,
    })

  useEffect(() => {
    if (latestCommunicationDraft?.status === "READY") {
      setPollForInboundDraft(false)
    }
  }, [latestCommunicationDraft?.status])

  useEffect(() => {
    if (!pollForInboundDraft) return
    const timeout = window.setTimeout(() => setPollForInboundDraft(false), 90_000)
    return () => window.clearTimeout(timeout)
  }, [pollForInboundDraft])

  const handleSendComment = async (comment: string, commentType: "INTERNAL" | "CUSTOMER") => {
    if (!disputeId) return
    try {
      await commentMutation.mutateAsync({ disputeId, comment, comment_type: commentType })
      toast({
        title: "Comment Posted",
        description: "Your comment was recorded successfully.",
        type: "success",
      })
    } catch {
      toast({
        title: "Comment Failed",
        description: "Unable to post comment. Please try again.",
        type: "error",
      })
    }
  }

  const handleAssociateDecision = async (decision: "APPROVE" | "REJECT", notes: string) => {
    if (!disputeId) return
    try {
      await associateDecisionMutation.mutateAsync({
        id: disputeId,
        decision,
        comments: notes || `Associate Decision: ${decision}`,
      })
      toast({
        title: "Decision Submitted",
        description: `Associate decision ${decision} processed.`,
        type: "success",
      })
      refetchDispute()
    } catch {
      toast({
        title: "Decision Failed",
        description: "Failed to process decision.",
        type: "error",
      })
    }
  }

  const handleEditAndApply = async (editedInvoice: EditableInvoiceData, notes: string) => {
    if (!disputeId) return
    try {
      await associateDecisionMutation.mutateAsync({
        id: disputeId,
        decision: "EDIT_AND_APPLY",
        comments: notes || "Associate edited and applied amendment",
        amended_invoice_json: editedInvoice as unknown as Record<string, unknown>,
      })
      toast({
        title: "Amendment Applied",
        description: "Edited invoice changes submitted for application.",
        type: "success",
      })
      refetchDispute()
    } catch {
      toast({
        title: "Edit & Apply Failed",
        description: "Failed to apply edited amendment.",
        type: "error",
      })
    }
  }

  const handlePaymentReviewDecision = async (
    decision: "SETTLEMENT_DONE" | "SETTLEMENT_NOT_DONE",
    notes: string
  ) => {
    if (!disputeId) return
    try {
      await paymentReviewMutation.mutateAsync({
        id: disputeId,
        decision,
        comments: notes || `Payment Review: ${decision.replace("_", " ")}`,
      })
      toast({
        title: "Payment Review Processed",
        description: `Status updated with ${decision.replace("_", " ")}.`,
        type: "success",
      })
      refetchDispute()
    } catch {
      toast({
        title: "Action Failed",
        description: "An error occurred.",
        type: "error",
      })
    }
  }

  const handleOperationalDecision = async (
    decision: "ACKNOWLEDGED" | "REJECTED",
    notes: string
  ) => {
    if (!disputeId) return
    try {
      await operationalDecisionMutation.mutateAsync({
        id: disputeId,
        decision,
        comments: notes || `Operational Decision: ${decision}`,
      })
      toast({
        title: "Operational Status Processed",
        description: `Decision processed: ${decision}`,
        type: "success",
      })
      refetchDispute()
    } catch {
      toast({
        title: "Action Failed",
        description: "An error occurred.",
        type: "error",
      })
    }
  }

  const handleEscalate = async (notes: string) => {
    if (!disputeId) return
    try {
      await escalateDisputeMutation.mutateAsync({
        id: disputeId,
        comments: notes,
      })
      toast({
        title: "Dispute Escalated",
        description: "The dispute was successfully escalated to your manager.",
        type: "success",
      })
      refetchDispute()
    } catch {
      toast({
        title: "Escalation Failed",
        description: "Failed to escalate the dispute. Please try again.",
        type: "error",
      })
    }
  }

  const handleCloseDispute = async (payload: DisputeClosePayload) => {
    if (!disputeId) return
    try {
      await closeDisputeMutation.mutateAsync({
        id: disputeId,
        ...payload,
      })
      setIsCloseOpen(false)
      toast({
        title: "Dispute closed",
        description: "The dispute was closed manually without sending an automated email.",
        type: "success",
      })
      refetchDispute()
    } catch {
      toast({
        title: "Close failed",
        description: "Unable to close the dispute. Please try again.",
        type: "error",
      })
    }
  }

  const handleDraftCommunication = async (instructions?: string) => {
    try {
      const draft = await draftCommunicationMutation.mutateAsync(instructions)
      toast({
        title: "Draft ready",
        description: "Review and edit the message before sending.",
        type: "success",
      })
      return draft
    } catch {
      toast({
        title: "Draft failed",
        description: "Could not generate email draft. Please try again.",
        type: "error",
      })
      throw new Error("Draft failed")
    }
  }

  const handleSendCommunication = async (payload: AssociateCommunicationSendPayload) => {
    try {
      const comm = await sendCommunicationMutation.mutateAsync(payload)
      if (comm.gmail_message_id) {
        toast({
          title: "Email sent",
          description: "Your message was delivered to the customer via Gmail.",
          type: "success",
        })
      } else {
        toast({
          title: "Email saved",
          description:
            "Your message was recorded on the dispute thread. Gmail delivery is pending or disabled.",
          type: "success",
        })
      }
    } catch {
      toast({
        title: "Send failed",
        description: "Could not send the email. Please try again.",
        type: "error",
      })
      throw new Error("Send failed")
    }
  }

  const actionState = dispute ? getDisputeActionState(dispute, wfContext) : null
  const communicationsAttention = dispute
    ? getCommunicationsAttentionState(dispute, latestCommunicationDraft, pollForInboundDraft)
    : { needsAttention: false, label: null }
  const allowPauseSlaTillReply =
    dispute?.status === "WAITING_ASSOCIATE_APPROVAL" ||
    dispute?.status === "WAITING_INTERNAL_TEAM" ||
    dispute?.status === "WAITING_PAYMENT_REVIEW"

  useEffect(() => {
    if (actionState?.hasPendingAction && attentionRef.current) {
      attentionRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [actionState?.hasPendingAction, dispute?.id])

  const handleCommsPanelOpenChange = (open: boolean) => {
    setIsCommsPanelOpen(open)
    if (!open) {
      setIsComposePaneOpen(false)
    }
  }

  const handleTabChange = (value: string) => {
    if (value === "communications") {
      setIsCommsPanelOpen(true)
      return
    }
    setActiveTab(value)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-96 w-full lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (isError || !dispute) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
        title="Dispute not found"
        action={
          <Button size="sm" onClick={() => refetchDispute()}>
            Retry
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <DisputeWorkspaceHeader
        dispute={dispute}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCommsPanelOpen(true)}
              className="relative"
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              Messages
              {communicationsAttention.needsAttention && (
                <Badge
                  variant="warning"
                  shape="pill"
                  className="ml-1.5"
                  title={communicationsAttention.label ?? undefined}
                >
                  {communicationsAttention.label ?? "Attention"}
                </Badge>
              )}
            </Button>
            {isNonClosedDispute(dispute) ? (
              <Button
                variant="secondary"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/5"
                onClick={() => setIsCloseOpen(true)}
              >
                Close dispute
              </Button>
            ) : null}
          </div>
        }
      />
      <DisputeWorkspaceKpis dispute={dispute} />

      <div ref={attentionRef}>
        <DisputeAttentionPanel
        actionState={actionState!}
        dispute={dispute}
        disputeCase={disputeCase}
        invoiceItems={invoiceItems}
        customerDetail={customerDetail}
        evidence={evidence}
        latestRecommendation={latestRecommendation}
        latestAmendmentRecommendation={latestAmendmentRecommendation}
        onAssociateDecision={handleAssociateDecision}
        onEditAndApply={handleEditAndApply}
        onPaymentReviewDecision={handlePaymentReviewDecision}
        onOperationalDecision={handleOperationalDecision}
        onEscalate={handleEscalate}
        />
      </div>

      <div className="w-full">
        <Tabs value={activeTab} onValueChange={handleTabChange} defaultValue="overview">
          <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview" className="relative">
                Overview
                {actionState!.hasPendingAction && (
                  <span
                    className={cn(
                      "ml-1.5 inline-block h-2 w-2 rounded-full bg-warning",
                      activeTab !== "overview" && "animate-pulse"
                    )}
                    aria-label="Action required"
                  />
                )}
              </TabsTrigger>
              <TabsTrigger value="invoice-payment">Invoice &amp; payment</TabsTrigger>
              <TabsTrigger
                value="communications"
                className={cn(
                  isCommsPanelOpen &&
                    "text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
                )}
              >
                Communications
                {communicationsAttention.needsAttention && (
                  <span
                    className={cn(
                      "ml-1.5 inline-block h-2 w-2 rounded-full bg-warning",
                      !isCommsPanelOpen && "animate-pulse"
                    )}
                    aria-label={communicationsAttention.label ?? "Communications need attention"}
                  />
                )}
              </TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="activities">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 min-h-[300px]">
              <DisputeOverviewTab
                dispute={dispute}
                disputeCase={disputeCase}
                evidence={evidence}
                latestRecommendation={latestRecommendation}
                allCommunications={allCommunications}
              />
            </TabsContent>

            <TabsContent value="invoice-payment" className="mt-4 min-h-[300px]">
              <DisputeInvoicePaymentTab
                dispute={dispute}
                disputeCase={disputeCase}
                invoiceItems={invoiceItems}
                customerDetail={customerDetail}
                evidence={evidence}
                isLoadingInvoiceItems={loading.invoiceItems}
                isLoadingCustomer={loading.customerDetail}
              />
            </TabsContent>

            <TabsContent value="comments" className="mt-4 min-h-[300px]">
              <DisputeCommentsTab
                comments={comments}
                isLoading={loading.comments}
                isSubmitting={commentMutation.isPending}
                onSendComment={handleSendComment}
              />
            </TabsContent>

            <TabsContent value="recommendations" className="mt-4 min-h-[300px]">
              <DisputeRecommendationsTab
                recommendations={recommendations}
                dispute={dispute}
                invoiceItems={invoiceItems}
                isLoading={loading.recommendations}
              />
            </TabsContent>

            <TabsContent value="activities" className="mt-4 min-h-[300px]">
              <DisputeActivityTab activities={activities} isLoading={loading.activities} />
            </TabsContent>

            <TabsContent value="customer" className="mt-4 min-h-[300px]">
              <DisputeCustomerCard
                dispute={dispute}
                customerDetail={customerDetail}
                isLoading={loading.customerDetail}
              />
            </TabsContent>
          </Tabs>
      </div>

      <DisputeCloseDialog
        open={isCloseOpen}
        onOpenChange={setIsCloseOpen}
        onConfirm={handleCloseDispute}
        isSubmitting={closeDisputeMutation.isPending}
      />

      <DisputeCommunicationsSheet
        open={isCommsPanelOpen}
        onOpenChange={handleCommsPanelOpenChange}
        communications={allCommunications}
        customerEmail={customerEmail}
        allowPauseSlaTillReply={allowPauseSlaTillReply}
        caseId={disputeCase?.id}
        caseAttachments={caseAttachments}
        isLoading={loading.communications}
        isLoadingAttachments={loading.caseAttachments}
        initialDraft={latestCommunicationDraft}
        isLoadingDraft={latestCommunicationDraft?.status === "GENERATING"}
        isDrafting={draftCommunicationMutation.isPending}
        isSending={sendCommunicationMutation.isPending}
        onOpenCompose={() => setIsComposePaneOpen(true)}
        onDraftEmail={handleDraftCommunication}
        onSendEmail={handleSendCommunication}
      />

      <DisputeComposePane
        open={isComposePaneOpen}
        commsSheetOpen={isCommsPanelOpen}
        customerEmail={customerEmail}
        allowPauseSlaTillReply={allowPauseSlaTillReply}
        initialDraft={latestCommunicationDraft}
        isLoadingDraft={latestCommunicationDraft?.status === "GENERATING"}
        isDrafting={draftCommunicationMutation.isPending}
        isSending={sendCommunicationMutation.isPending}
        onClose={() => setIsComposePaneOpen(false)}
        onDraft={handleDraftCommunication}
        onSend={handleSendCommunication}
        onSent={() => setIsComposePaneOpen(false)}
      />
    </div>
  )
}

export default DisputeDetailPage
