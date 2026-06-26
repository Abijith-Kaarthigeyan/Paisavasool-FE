import React, { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import {
  useCreateComment,
  useAssociateDecision,
  usePaymentReviewDecision,
  useOperationalDecision,
} from "../hooks/useDisputes"
import { useDisputeWorkspace } from "../hooks/useDisputeWorkspace"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/toast"
import { AlertTriangle } from "lucide-react"
import { EditableInvoiceData } from "../components/EditableRecommendedInvoiceForm"
import { DisputeWorkspaceHeader } from "../components/workspace/DisputeWorkspaceHeader"
import { DisputeWorkspaceKpis } from "../components/workspace/DisputeWorkspaceKpis"
import { DisputeAttentionPanel } from "../components/workspace/DisputeAttentionPanel"
import { DisputeContextRail } from "../components/workspace/DisputeContextRail"
import { DisputeOverviewTab } from "../components/workspace/DisputeOverviewTab"
import { DisputeCommunicationsTab } from "../components/workspace/DisputeCommunicationsTab"
import { DisputeCommentsTab } from "../components/workspace/DisputeCommentsTab"
import { DisputeRecommendationsTab } from "../components/workspace/DisputeRecommendationsTab"
import { DisputeActivityTab } from "../components/workspace/DisputeActivityTab"
import { cn } from "@/lib/utils"

import { getDisputeActionState } from "../utils/disputeWorkspaceUtils"

export const DisputeDetailPage: React.FC = () => {
  const { disputeId } = useParams<{ disputeId: string }>()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const attentionRef = useRef<HTMLDivElement>(null)

  const workspace = useDisputeWorkspace(disputeId || "")
  const {
    dispute,
    disputeCase,
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

  const actionState = dispute ? getDisputeActionState(dispute, wfContext) : null

  useEffect(() => {
    if (actionState?.hasPendingAction && attentionRef.current) {
      attentionRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [actionState?.hasPendingAction, dispute?.id])

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
      <DisputeWorkspaceHeader dispute={dispute} />
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
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DisputeContextRail
          dispute={dispute}
          disputeCase={disputeCase}
          invoiceItems={invoiceItems}
          customerDetail={customerDetail}
          evidence={evidence}
          isLoadingInvoiceItems={loading.invoiceItems}
          isLoadingCustomer={loading.customerDetail}
        />

        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="overview">
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
              <TabsTrigger value="communications">Communications</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
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

            <TabsContent value="communications" className="mt-4 min-h-[300px]">
              <DisputeCommunicationsTab
                communications={allCommunications}
                customerEmail={customerEmail}
                messageId={disputeCase?.original_message_id}
                isLoading={loading.communications}
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
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default DisputeDetailPage
