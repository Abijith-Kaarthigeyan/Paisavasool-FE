import React, { useCallback, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  useDispute,
  useCase,
  useActivities,
  useComments,
  useRecommendations,
  useCommunications,
  useEvidence,
  useWorkflowContext,
  useCreateComment,
  useAssociateDecision,
  usePaymentReviewDecision,
  useOperationalDecision,
} from "../hooks/useDisputes"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Timeline, TimelineItem } from "@/components/ui/timeline"
import { AiAgentCard } from "@/components/ui/ai-agent-card"
import { EmptyState } from "@/components/ui/empty-state"
import { SLAProgress } from "../components/SLAProgress"
import { RecommendedInvoiceCard } from "../components/RecommendedInvoiceCard"
import {
  EditableRecommendedInvoiceForm,
  EditableInvoiceData,
} from "../components/EditableRecommendedInvoiceForm"
import {
  formatSlaStatusLabel,
  getCommunicationAddress,
  getCommunicationDirection,
  getCommunicationTypeLabel,
  isTerminalDisputeStatus,
  normalizeConfidence,
  parseRecommendationAction,
} from "../utils/disputeFormatters"
import {
  DISPUTE_STATUS_VARIANT,
  PRIORITY_VARIANT,
  getStatusVariant,
} from "@/lib/design-tokens"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  Calendar,
  Clock,
  AlertTriangle,
  Send,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

const WORKFLOW_STEPS = [
  "Intake email received",
  "AI classification complete",
  "Validation logic complete",
  "Human decision audit",
] as const

function WorkflowStepper({ disputeStatus }: { disputeStatus: string }) {
  const resolved = isTerminalDisputeStatus(disputeStatus)

  return (
    <div className="space-y-4">
      {WORKFLOW_STEPS.map((label, index) => {
        const isLast = index === WORKFLOW_STEPS.length - 1
        const isComplete = !isLast || resolved
        const isActive = isLast && !resolved

        return (
          <div key={label} className="flex items-center gap-3">
            <span
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full",
                isComplete ? "bg-success" : isActive ? "bg-warning" : "bg-muted",
                isActive && "animate-pulse"
              )}
              aria-hidden
            />
            <span
              className={cn(
                "text-sm",
                isActive ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export const DisputeDetailPage: React.FC = () => {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Query Hooks
  const { data: dispute, isLoading: isDisputeLoading, isError: isDisputeError, refetch: refetchDispute } = useDispute(disputeId || "");
  const { data: disputeCase } = useCase(dispute?.case_id || "");
  const { data: activities = [], isLoading: isActivitiesLoading } = useActivities(disputeId || "");
  const { data: comments = [], isLoading: isCommentsLoading } = useComments(disputeId || "");
  const { data: recommendations = [], isLoading: isRecsLoading } = useRecommendations(disputeId || "");
  const { data: communications = [], isLoading: isCommsLoading } = useCommunications(disputeId || "");
  const { data: evidence = [], isLoading: isEvidenceLoading } = useEvidence(disputeId || "");
  const { data: wfContext, isLoading: isWfLoading } = useWorkflowContext(disputeId || "");

  const customerEmail =
    disputeCase?.customer_email || dispute?.customer?.email || null;

  const allCommunications = useMemo(() => {
    const items = [...communications];
    const caseBody = (disputeCase?.raw_content || disputeCase?.email_body || "").trim();

    if (caseBody) {
      const alreadyIncluded = communications.some((comm) => {
        const body = comm.message_body || "";
        return body.includes(caseBody.slice(0, Math.min(caseBody.length, 80)));
      });

      if (!alreadyIncluded) {
        items.unshift({
          id: `case-${disputeCase?.id || "origin"}`,
          dispute_id: disputeId || "",
          recipient: customerEmail || "customer",
          subject: disputeCase?.email_subject || "Original customer email",
          message_body: caseBody,
          communication_type: "CUSTOMER",
          sent_time: disputeCase?.created_at || dispute?.created_at || "",
          created_at: disputeCase?.created_at || dispute?.created_at || "",
        });
      }
    }

    return items.sort((a, b) => {
      const aTime = new Date(a.sent_time || a.created_at).getTime();
      const bTime = new Date(b.sent_time || b.created_at).getTime();
      return aTime - bTime;
    });
  }, [communications, disputeCase, dispute, disputeId, customerEmail]);

  const getCommunicationBody = (comm: (typeof communications)[number]) =>
    comm.message_body || (comm as { body?: string }).body || "";

  const getCommunicationTime = (comm: (typeof communications)[number]) =>
    comm.sent_time || comm.created_at || (comm as { created_at?: string }).created_at;

  // Mutation Hooks
  const commentMutation = useCreateComment();
  const associateDecisionMutation = useAssociateDecision();
  const paymentReviewMutation = usePaymentReviewDecision();
  const operationalDecisionMutation = useOperationalDecision();

  // Comments form
  const [commentText, setCommentText] = useState("");
  const [commentType, setCommentType] = useState<"INTERNAL" | "CUSTOMER">("INTERNAL");

  // Expandable communication body
  const [expandedCommId, setExpandedCommId] = useState<string | null>(null);

  // Decision Modal inputs
  const [decisionNotes, setDecisionNotes] = useState("");
  const [showEditApply, setShowEditApply] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<EditableInvoiceData | null>(null);

  const latestAmendmentRecommendation = useMemo(() => {
    return recommendations.find((rec) => rec.recommended_invoice_json) || null;
  }, [recommendations]);

  const handleEditedInvoiceChange = useCallback((data: EditableInvoiceData) => {
    setEditedInvoice(data);
  }, []);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !disputeId) return;

    try {
      await commentMutation.mutateAsync({
        disputeId,
        comment: commentText,
        comment_type: commentType,
      });
      setCommentText("");
      toast({
        title: "Comment Posted",
        description: "Your comment was recorded successfully.",
        type: "success",
      });
    } catch (err) {
      toast({
        title: "Comment Failed",
        description: "Unable to post comment. Please try again.",
        type: "error",
      });
    }
  };

  const handleAssociateDecision = async (decision: "APPROVE" | "REJECT") => {
    if (!disputeId) return;
    try {
      await associateDecisionMutation.mutateAsync({
        id: disputeId,
        decision,
        comments: decisionNotes || `Associate Decision: ${decision}`,
      });
      setDecisionNotes("");
      setShowEditApply(false);
      toast({
        title: "Decision Submitted",
        description: `Associate decision ${decision} processed.`,
        type: "success",
      });
      refetchDispute();
    } catch (err) {
      toast({
        title: "Decision Failed",
        description: "Failed to process decision.",
        type: "error",
      });
    }
  };

  const handleEditAndApply = async () => {
    if (!disputeId || !editedInvoice) return;
    try {
      await associateDecisionMutation.mutateAsync({
        id: disputeId,
        decision: "EDIT_AND_APPLY",
        comments: decisionNotes || "Associate edited and applied amendment",
        amended_invoice_json: editedInvoice as unknown as Record<string, unknown>,
      });
      setDecisionNotes("");
      setShowEditApply(false);
      toast({
        title: "Amendment Applied",
        description: "Edited invoice changes submitted for application.",
        type: "success",
      });
      refetchDispute();
    } catch (err) {
      toast({
        title: "Edit & Apply Failed",
        description: "Failed to apply edited amendment.",
        type: "error",
      });
    }
  };

  const handlePaymentReviewDecision = async (decision: "SETTLEMENT_DONE" | "SETTLEMENT_NOT_DONE") => {
    if (!disputeId) return;
    try {
      await paymentReviewMutation.mutateAsync({
        id: disputeId,
        decision,
        comments: decisionNotes || `Payment Review: ${decision.replace("_", " ")}`,
      });
      setDecisionNotes("");
      toast({
        title: "Payment Review Processed",
        description: `Status updated with ${decision.replace("_", " ")}.`,
        type: "success",
      });
      refetchDispute();
    } catch (err) {
      toast({
        title: "Action Failed",
        description: "An error occurred.",
        type: "error",
      });
    }
  };

  const handleOperationalDecision = async (decision: "ACKNOWLEDGED" | "REJECTED") => {
    if (!disputeId) return;
    try {
      await operationalDecisionMutation.mutateAsync({
        id: disputeId,
        decision,
        comments: decisionNotes || `Operational Decision: ${decision}`,
      });
      setDecisionNotes("");
      toast({
        title: "Operational Status Processed",
        description: `Decision processed: ${decision}`,
        type: "success",
      });
      refetchDispute();
    } catch (err) {
      toast({
        title: "Action Failed",
        description: "An error occurred.",
        type: "error",
      });
    }
  };

  if (isDisputeLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isDisputeError || !dispute) {
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
    );
  }

  const priorityKey = !dispute.sla
    ? "N/A"
    : dispute.sla.status === "BREACHED"
    ? "HIGH"
    : dispute.sla.status === "AT_RISK"
    ? "MEDIUM"
    : "LOW";

  // Determine active action triggers based on node state
  const currentNode = wfContext?.current_node || "";
  const isWaitingAssociateApproval =
    currentNode === "waiting_approval_node" ||
    dispute.status === "WAITING_ASSOCIATE_APPROVAL" ||
    dispute.status === "IN_REVIEW";
  const isWaitingPaymentReview =
    dispute.status === "WAITING_PAYMENT_REVIEW" ||
    (currentNode === "waiting_resolution_node" && (dispute.status === "WAITING_PAYMENT_REVIEW" || dispute.dispute_category === "SHORT_PAYMENT"));
  const isWaitingOperationalReview =
    dispute.status === "WAITING_INTERNAL_TEAM" ||
    (currentNode === "waiting_resolution_node" && (dispute.status === "WAITING_INTERNAL_TEAM" || dispute.dispute_category !== "SHORT_PAYMENT"));
  const isPaymentCategory = ["PAYMENT_ALREADY_DONE", "PAYMENT_NOT_REFLECTED"].includes(
    dispute.dispute_category
  );
  const isPaymentSettlementConfirmation =
    isWaitingAssociateApproval && isPaymentCategory;
  const isAmendmentDispute =
    dispute.dispute_category === "AMENDMENT" && !isPaymentSettlementConfirmation;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <header className="space-y-4 border-b border-border pb-5">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Back
        </Button>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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

          <div className="w-full md:w-64">
            {dispute.sla ? (
              <SLAProgress
                percentage={dispute.sla.current_percentage}
                isPaused={dispute.sla.is_paused}
                status={dispute.sla.status}
                disputeStatus={dispute.status}
              />
            ) : (
              <span className="text-sm text-muted-foreground">
                {formatSlaStatusLabel(null)}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Human Actions Workflow Panel */}
      {(isWaitingAssociateApproval || isWaitingPaymentReview || isWaitingOperationalReview) && (
        <Card className="border-warning/30 bg-warning-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-warning">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              {isPaymentSettlementConfirmation
                ? "Action required — confirm settlement"
                : "Action required — workflow suspended"}
            </CardTitle>
            <CardDescription>
              {isPaymentSettlementConfirmation ? (
                <>
                  Payment verification indicates the customer is correct. Confirm settlement
                  before closing this dispute.
                </>
              ) : (
                <>
                  State node:{" "}
                  <span className="font-mono font-medium">
                    {currentNode || "WAITING_HUMAN_INTERVENTION"}
                  </span>
                  . Submit a manual decision to resume execution.
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="decision-notes">Decision notes</Label>
              <textarea
                id="decision-notes"
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder={
                  isPaymentSettlementConfirmation
                    ? "Include settlement reference or notes…"
                    : "Include details explaining your decision…"
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {isWaitingAssociateApproval && (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleAssociateDecision("APPROVE")}
                  >
                    {isPaymentSettlementConfirmation
                      ? "Confirm settlement"
                      : "Approve resolution"}
                  </Button>
                  {isAmendmentDispute && latestAmendmentRecommendation?.recommended_invoice_json && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowEditApply((v) => !v)}
                    >
                      {showEditApply ? "Cancel edit" : "Edit & apply"}
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleAssociateDecision("REJECT")}
                  >
                    {isPaymentSettlementConfirmation
                      ? "Settlement not confirmed"
                      : "Reject & reroute"}
                  </Button>
                </>
              )}
              {isWaitingPaymentReview && (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handlePaymentReviewDecision("SETTLEMENT_DONE")}
                  >
                    Settlement done
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handlePaymentReviewDecision("SETTLEMENT_NOT_DONE")}
                  >
                    Settlement not done
                  </Button>
                </>
              )}
              {isWaitingOperationalReview && (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleOperationalDecision("ACKNOWLEDGED")}
                  >
                    Acknowledge
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleOperationalDecision("REJECTED")}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
            {showEditApply && latestAmendmentRecommendation?.recommended_invoice_json && (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Edit invoice before applying
                </p>
                <EditableRecommendedInvoiceForm
                  initialInvoice={
                    latestAmendmentRecommendation.recommended_invoice_json as Record<
                      string,
                      unknown
                    >
                  }
                  onChange={handleEditedInvoiceChange}
                />
                <Button
                  size="sm"
                  onClick={handleEditAndApply}
                  disabled={!editedInvoice}
                >
                  Submit edited amendment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-5 text-sm md:grid-cols-4 lg:grid-cols-6">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Invoice</span>
            <span className="block font-medium text-foreground">{dispute.invoice_number}</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Customer</span>
            <span className="block max-w-[120px] truncate font-medium text-foreground">
              {dispute.customer?.customer_name || "Pending"}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Associate</span>
            <span className="block font-medium text-foreground">
              {dispute.assigned_user_name || "Unassigned"}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Manager</span>
            <span className="block font-medium text-foreground">
              {dispute.manager_name || "Finance manager"}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Created</span>
            <span className="block tabular-nums text-muted-foreground">
              {new Date(dispute.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Updated</span>
            <span className="block tabular-nums text-muted-foreground">
              {new Date(dispute.updated_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activity</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="min-h-[300px]">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-6 md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dispute summary</CardTitle>
                    <CardDescription>Checkpoints generated automatically.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-relaxed">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">Dispute number</span>
                        <p className="mt-0.5 font-medium text-foreground">{dispute.dispute_number}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Resolution outcome</span>
                        <p className="mt-0.5 font-medium text-foreground">
                          {dispute.resolution_outcome || "Pending validation"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Workflow status</span>
                        <p className="mt-0.5 font-medium text-foreground">{dispute.status}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Active node</span>
                        <p className="mt-0.5 font-mono text-sm text-foreground">
                          {currentNode || "Ingest node"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Invoice details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between border-b border-border py-1">
                      <span className="text-muted-foreground">Total amount</span>
                      <span className="font-medium tabular-nums text-foreground">
                        ₹{dispute.invoice?.total_amount?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border py-1">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span className="font-medium tabular-nums text-destructive">
                        ₹{dispute.invoice?.outstanding_amount?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-muted-foreground">Due date</span>
                      <span className="font-medium tabular-nums">
                        {dispute.invoice?.due_date
                          ? new Date(dispute.invoice.due_date).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
        </TabsContent>

        <TabsContent value="activities" className="min-h-[300px]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity timeline</CardTitle>
                <CardDescription>Chronological audit of the dispute lifecycle.</CardDescription>
              </CardHeader>
              <CardContent>
                {isActivitiesLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : activities.length === 0 ? (
                  <EmptyState
                    title="No activities"
                    description="No activity has been recorded for this dispute yet."
                    className="py-8"
                  />
                ) : (
                  <Timeline>
                    {activities.map((act) => (
                      <div key={act.id}>
                        <TimelineItem
                          icon={<Clock className="h-2.5 w-2.5" />}
                          title={act.activity_type.replace(/_/g, " ")}
                          timestamp={new Date(act.created_at).toLocaleString()}
                          tone="primary"
                        />
                        {act.activity_metadata && (
                          <pre className="ml-6 mt-2 overflow-x-auto rounded-md border border-border bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground">
                            {JSON.stringify(act.activity_metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </Timeline>
                )}
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="comments" className="min-h-[300px]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-[300px] space-y-3 overflow-y-auto pr-2">
                  {isCommentsLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : comments.length === 0 ? (
                    <EmptyState
                      title="No comments yet"
                      description="Start the thread with an internal note or customer message."
                      className="py-6"
                    />
                  ) : (
                    comments.map((c) => {
                      const isInternal = c.comment_type === "INTERNAL"
                      const isSystem = c.comment_type === "SYSTEM"

                      return (
                        <div
                          key={c.id}
                          className={cn(
                            "max-w-[85%] rounded-lg border p-3 text-sm",
                            isSystem
                              ? "mx-auto w-full border-border bg-muted/40 text-center text-muted-foreground"
                              : isInternal
                              ? "ml-0 border-warning/20 bg-warning-muted/20"
                              : "ml-auto border-primary/20 bg-primary/[0.03]"
                          )}
                        >
                          {!isSystem && (
                            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{c.created_by_name || "Associate"}</span>
                              <Badge
                                variant={isInternal ? "warning" : "default"}
                                shape="pill"
                              >
                                {c.comment_type}
                              </Badge>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{c.comment}</p>
                          {!isSystem && (
                            <time className="mt-1.5 block text-right text-xs tabular-nums text-muted-foreground">
                              {new Date(c.created_at).toLocaleString()}
                            </time>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                <form
                  onSubmit={handleSendComment}
                  className="flex gap-2 border-t border-border pt-4"
                >
                  <Select
                    value={commentType}
                    onChange={(e) => setCommentType(e.target.value as "INTERNAL" | "CUSTOMER")}
                    className="w-36"
                  >
                    <option value="INTERNAL">Internal</option>
                    <option value="CUSTOMER">To customer</option>
                  </Select>
                  <Input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment or validation update…"
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    variant="icon"
                    size="md"
                    disabled={commentMutation.isPending || !commentText.trim()}
                    aria-label="Send comment"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="min-h-[300px]">
            <div className="space-y-4">
              {isRecsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : recommendations.length === 0 ? (
                <EmptyState
                  title="No recommendations"
                  description="The AI agent has not generated recommendations for this dispute yet."
                  className="py-8"
                />
              ) : (
                recommendations.map((rec) => {
                  const parsed = parseRecommendationAction(rec.recommended_action)
                  const confidence = normalizeConfidence(rec.confidence)

                  return (
                    <AiAgentCard
                      key={rec.id}
                      agentName={rec.created_by_agent}
                      stage={parsed.outcome}
                      stageLabel="Suggested action"
                      confidence={confidence}
                      status="complete"
                    >
                      {parsed.reasoning && (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {parsed.reasoning}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Generated {new Date(rec.created_at).toLocaleString()}
                      </p>
                      {rec.recommended_invoice_json && (
                        <RecommendedInvoiceCard invoice={rec.recommended_invoice_json} />
                      )}
                    </AiAgentCard>
                  )
                })
              )}
            </div>
        </TabsContent>

        <TabsContent value="communications" className="min-h-[300px]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Communications</CardTitle>
                <CardDescription>
                  Customer emails and internal notifications for this dispute.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isCommsLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : allCommunications.length === 0 ? (
                  <EmptyState
                    title="No correspondence"
                    description="No communications have been recorded for this dispute."
                    className="py-8"
                  />
                ) : (
                  allCommunications.map((comm) => {
                    const isExpanded = expandedCommId === comm.id
                    const direction = getCommunicationDirection(comm)
                    const address = getCommunicationAddress(comm, customerEmail)
                    const typeLabel = getCommunicationTypeLabel(comm)
                    return (
                      <div
                        key={comm.id}
                        onClick={() => setExpandedCommId(isExpanded ? null : comm.id)}
                        className="cursor-pointer rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-muted/40"
                      >
                        <div className="flex items-center justify-between gap-3 font-medium text-foreground">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                            <Badge
                              variant={direction === "Sent" ? "default" : "outline"}
                              shape="pill"
                            >
                              {direction}
                            </Badge>
                            <Badge variant="outline" shape="pill">
                              {typeLabel}
                            </Badge>
                            <span className="truncate font-mono text-xs text-muted-foreground">
                              {direction === "Sent" ? `To: ${address}` : `From: ${address}`}
                            </span>
                          </span>
                          <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {getCommunicationTime(comm)
                              ? new Date(getCommunicationTime(comm)!).toLocaleString()
                              : "—"}
                          </time>
                        </div>
                        <p className="mt-1.5 font-medium">{comm.subject}</p>
                        {isExpanded && (
                          <div className="mt-3 whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
                            {getCommunicationBody(comm)}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="evidence" className="min-h-[300px]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evidence snapshots</CardTitle>
                <CardDescription>System snapshots capturing validation parameters.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {isEvidenceLoading ? (
                  <Skeleton className="col-span-2 h-32 w-full" />
                ) : evidence.length === 0 ? (
                  <EmptyState
                    title="No evidence"
                    description="No evidence snapshots have been captured."
                    className="col-span-2 py-8"
                  />
                ) : (
                  evidence.map((ev) => (
                    <Card key={ev.id} className="border-border bg-muted/20">
                      <CardHeader className="border-b border-border p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {ev.snapshot_type.replace(/_/g, " ")}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs">
                          {new Date(ev.created_at).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3">
                        <pre className="max-h-[150px] overflow-x-auto rounded-md border border-border bg-foreground p-3 font-mono text-[11px] leading-relaxed text-background">
                          {JSON.stringify(ev.snapshot_data, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="workflow" className="min-h-[300px]">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-4 md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Workflow context</CardTitle>
                    <CardDescription>Active LangGraph execution state.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isWfLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : !wfContext ? (
                      <EmptyState
                        title="No workflow context"
                        description="No active workflow context for this dispute."
                        className="py-8"
                      />
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Workflow</span>
                            <p className="mt-0.5 font-medium">{wfContext.workflow_name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Current node</span>
                            <p className="mt-0.5 font-mono font-medium text-primary">
                              {wfContext.current_node}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last checkpoint</span>
                            <p className="mt-0.5 font-mono text-sm">
                              {wfContext.last_checkpoint || "None"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status</span>
                            <p className="mt-0.5 font-medium">{wfContext.status || "Waiting"}</p>
                          </div>
                        </div>

                        <div className="border-t border-border pt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-0 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowTechnicalDetails((v) => !v)}
                          >
                            {showTechnicalDetails ? (
                              <ChevronUp className="h-4 w-4" aria-hidden />
                            ) : (
                              <ChevronDown className="h-4 w-4" aria-hidden />
                            )}
                            Technical details
                          </Button>
                          {showTechnicalDetails && (
                            <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted/40 p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
                              {JSON.stringify(wfContext.workflow_state, null, 2)}
                            </pre>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-base">Workflow steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <WorkflowStepper disputeStatus={dispute.status} />
                </CardContent>
              </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DisputeDetailPage;
