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
import { SLAProgress } from "../components/SLAProgress"
import { RecommendedInvoiceCard } from "../components/RecommendedInvoiceCard"
import {
  EditableRecommendedInvoiceForm,
  EditableInvoiceData,
} from "../components/EditableRecommendedInvoiceForm"
import {
  formatConfidencePercent,
  formatSlaStatusLabel,
  getCommunicationAddress,
  getCommunicationDirection,
  getCommunicationTypeLabel,
  parseRecommendationAction,
} from "../utils/disputeFormatters"
import {
  ChevronLeft,
  Calendar,
  Clock,
  AlertTriangle,
  Send,
  Mail,
} from "lucide-react"

export const DisputeDetailPage: React.FC = () => {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "overview" | "activities" | "comments" | "recommendations" | "communications" | "evidence" | "workflow"
  >("overview");

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
      <div className="p-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="text-base font-bold text-foreground">Dispute Not Found</h3>
        <button
          onClick={() => refetchDispute()}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "HIGH": return "destructive";
      case "MEDIUM": return "warning";
      default: return "default";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "OPEN": return "default";
      case "IN_REVIEW": return "info";
      case "WAITING_CUSTOMER": return "warning";
      case "WAITING_INTERNAL": return "warning";
      case "WAITING_INTERNAL_TEAM": return "warning";
      case "WAITING_ASSOCIATE_APPROVAL": return "warning";
      case "WAITING_PAYMENT_REVIEW": return "warning";
      case "RESOLVED": return "success";
      case "CLOSED": return "outline";
      default: return "outline";
    }
  };

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
    <div className="space-y-6">
      {/* Back navigation & header */}
      <header className="space-y-3 border-b border-border pb-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-xs font-bold text-muted-foreground hover:text-foreground gap-1 transition-colors"
        >
          <ChevronLeft className="h-3 w-3" /> Back
        </button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
                Dispute {dispute.dispute_number}
              </h1>
              <Badge variant={getStatusBadgeVariant(dispute.status)}>
                {dispute.status.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className="uppercase text-[9px] font-bold">
                {dispute.dispute_category}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(
                !dispute.sla
                  ? "LOW"
                  : dispute.sla.status === "BREACHED"
                  ? "HIGH"
                  : dispute.sla.status === "AT_RISK"
                  ? "MEDIUM"
                  : "LOW"
              )} className="uppercase text-[9px] font-bold">
                Priority: {!dispute.sla
                  ? "N/A"
                  : dispute.sla.status === "BREACHED"
                  ? "HIGH"
                  : dispute.sla.status === "AT_RISK"
                  ? "MEDIUM"
                  : "LOW"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Opened on {new Date(dispute.created_at).toLocaleString()}
            </p>
          </div>

          {/* SLA Component Header */}
          <div className="w-full md:w-64">
            {dispute.sla ? (
              <SLAProgress
                percentage={dispute.sla.current_percentage}
                isPaused={dispute.sla.is_paused}
                status={dispute.sla.status}
                disputeStatus={dispute.status}
              />
            ) : (
              <span className="text-muted-foreground text-[10px] font-bold">
                {formatSlaStatusLabel(null)}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Human Actions Workflow Panel */}
      {(isWaitingAssociateApproval || isWaitingPaymentReview || isWaitingOperationalReview) && (
        <Card className="border-amber-500/20 bg-amber-500/5 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="h-4.5 w-4.5" />{" "}
              {isPaymentSettlementConfirmation
                ? "Action Required - Confirm Settlement"
                : "Action Required - Workflow Suspended at Node"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isPaymentSettlementConfirmation ? (
                <>
                  Payment verification indicates the customer is correct. Confirm that
                  settlement has been completed before closing this dispute.
                </>
              ) : (
                <>
                  State node:{" "}
                  <span className="font-mono font-semibold">
                    {currentNode || "WAITING_HUMAN_INTERVENTION"}
                  </span>
                  . Submit manual decision overrides to resume execution.
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Decision Notes / Comments
              </label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder={
                  isPaymentSettlementConfirmation
                    ? "Include settlement reference or notes..."
                    : "Include details explaining approval decisions..."
                }
                className="w-full text-xs p-2 rounded-md border border-input bg-background focus:outline-hidden text-foreground min-h-[50px]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {isWaitingAssociateApproval && (
                <>
                  <button
                    onClick={() => handleAssociateDecision("APPROVE")}
                    className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-md transition-colors"
                  >
                    {isPaymentSettlementConfirmation
                      ? "Confirm Settlement"
                      : "Approve Resolution"}
                  </button>
                  {isAmendmentDispute && latestAmendmentRecommendation?.recommended_invoice_json && (
                    <button
                      onClick={() => setShowEditApply((v) => !v)}
                      className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                    >
                      {showEditApply ? "Cancel Edit" : "Edit & Apply"}
                    </button>
                  )}
                  <button
                    onClick={() => handleAssociateDecision("REJECT")}
                    className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-md transition-colors"
                  >
                    {isPaymentSettlementConfirmation
                      ? "Settlement Not Confirmed"
                      : "Reject & Reroute"}
                  </button>
                </>
              )}
              {isWaitingPaymentReview && (
                <>
                  <button
                    onClick={() => handlePaymentReviewDecision("SETTLEMENT_DONE")}
                    className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-md transition-colors"
                  >
                    Settlement Done
                  </button>
                  <button
                    onClick={() => handlePaymentReviewDecision("SETTLEMENT_NOT_DONE")}
                    className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-md transition-colors"
                  >
                    Settlement Not Done
                  </button>
                </>
              )}
              {isWaitingOperationalReview && (
                <>
                  <button
                    onClick={() => handleOperationalDecision("ACKNOWLEDGED")}
                    className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-md transition-colors"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleOperationalDecision("REJECTED")}
                    className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-md transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
            {showEditApply && latestAmendmentRecommendation?.recommended_invoice_json && (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
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
                <button
                  onClick={handleEditAndApply}
                  disabled={!editedInvoice}
                  className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                >
                  Submit Edited Amendment
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Dashboard Panel */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-xs font-medium">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Invoice Number</span>
            <span className="font-bold text-foreground text-sm">{dispute.invoice_number}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Client customer</span>
            <span className="font-bold text-foreground truncate block max-w-[120px]">{dispute.customer?.customer_name || "Client Details Pending"}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned Associate</span>
            <span className="font-bold text-foreground">{dispute.assigned_user_name || "Unassigned"}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Finance Manager</span>
            <span className="font-bold text-foreground">{dispute.manager_name || "Finance Manager"}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Created Date</span>
            <span className="font-semibold text-muted-foreground">{new Date(dispute.created_at).toLocaleDateString()}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Last Updated</span>
            <span className="font-semibold text-muted-foreground">{new Date(dispute.updated_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Layout */}
      <div className="space-y-4">
        {/* Navigation tabs */}
        <div className="flex border-b border-border gap-2 overflow-x-auto no-scrollbar py-1">
          {(["overview", "activities", "comments", "recommendations", "communications", "evidence", "workflow"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold capitalize border-b-2 rounded-t-lg transition-all ${
                activeTab === tab
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[300px]">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Overview panels */}
              <div className="md:col-span-2 space-y-6">
                <Card className="shadow-xs border-border">
                  <CardHeader>
                    <CardTitle className="text-sm">Dispute Summary Details</CardTitle>
                    <CardDescription>Overview checkpoints generated automatically.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground font-semibold block">Dispute Number</span>
                        <span className="font-bold text-foreground mt-0.5 block">{dispute.dispute_number}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold block">Resolution Outcome</span>
                        <span className="font-bold text-foreground mt-0.5 block">
                          {dispute.resolution_outcome || "Pending validation analysis"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold block">Workflow Status</span>
                        <span className="font-bold text-foreground mt-0.5 block">{dispute.status}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold block">Last Active Node</span>
                        <span className="font-mono text-foreground mt-0.5 block">{currentNode || "Ingest Node"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side panel */}
              <div className="space-y-6">
                <Card className="shadow-xs border-border">
                  <CardHeader>
                    <CardTitle className="text-sm">Invoice details</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-3">
                    <div className="flex justify-between items-center py-1 border-b border-border">
                      <span className="text-muted-foreground">Total Amount</span>
                      <span className="font-mono font-bold text-foreground">
                        ₹{dispute.invoice?.total_amount?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border">
                      <span className="text-muted-foreground">Outstanding Amount</span>
                      <span className="font-mono font-bold text-rose-500">
                        ₹{dispute.invoice?.outstanding_amount?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">Invoice Due Date</span>
                      <span className="font-semibold text-foreground">
                        {dispute.invoice?.due_date ? new Date(dispute.invoice.due_date).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "activities" && (
            <Card className="shadow-xs border-border">
              <CardHeader>
                <CardTitle className="text-sm">Timeline Activities</CardTitle>
                <CardDescription>Chronological event audit details of the dispute life cycle.</CardDescription>
              </CardHeader>
              <CardContent>
                {isActivitiesLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">No activities recorded.</div>
                ) : (
                  <div className="relative pl-6 border-l border-border space-y-6 text-xs ml-2">
                    {activities.map((act) => (
                      <div key={act.id} className="relative">
                        <span className="absolute -left-[31px] top-0.5 rounded-full p-1 bg-slate-100 dark:bg-zinc-800 text-slate-500 border border-border">
                          <Clock className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-foreground text-sm">
                              {act.activity_type.replace("_", " ")}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(act.created_at).toLocaleString()}
                            </span>
                          </div>
                          {act.activity_metadata && (
                            <pre className="mt-1 p-2 rounded-lg bg-slate-50 dark:bg-zinc-950/20 text-[10px] text-muted-foreground font-mono overflow-x-auto max-w-full">
                              {JSON.stringify(act.activity_metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "comments" && (
            <Card className="shadow-xs border-border">
              <CardHeader>
                <CardTitle className="text-sm">Collaborative Comments Thread</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Chat list */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {isCommentsLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : comments.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">No comments yet. Start the thread.</div>
                  ) : (
                    comments.map((c) => {
                      const isInternal = c.comment_type === "INTERNAL";
                      const isSystem = c.comment_type === "SYSTEM";

                      return (
                        <div
                          key={c.id}
                          className={`p-3 rounded-lg border text-xs max-w-[85%] ${
                            isSystem
                              ? "bg-slate-100/50 dark:bg-zinc-900/20 text-muted-foreground border-slate-200/50 mx-auto w-full text-center"
                              : isInternal
                              ? "bg-amber-500/5 border-amber-500/10 text-foreground ml-0"
                              : "bg-blue-500/5 border-blue-500/10 text-foreground ml-auto"
                          }`}
                        >
                          {!isSystem && (
                            <div className="flex justify-between items-center mb-1 font-semibold text-[10px] uppercase text-muted-foreground">
                              <span>{c.created_by_name || "Associate"}</span>
                              <Badge variant={isInternal ? "warning" : "default"} className="text-[9px] py-0 px-1 font-bold">
                                {c.comment_type}
                              </Badge>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{c.comment}</p>
                          {!isSystem && (
                            <span className="text-[9px] text-muted-foreground block text-right mt-1.5 font-mono">
                              {new Date(c.created_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Submitting form */}
                <form onSubmit={handleSendComment} className="flex gap-2 pt-2 border-t border-border">
                  <select
                    value={commentType}
                    onChange={(e) => setCommentType(e.target.value as any)}
                    className="rounded-lg border border-input bg-background p-1.5 text-xs font-semibold text-foreground focus:outline-hidden"
                  >
                    <option value="INTERNAL">Internal Notes</option>
                    <option value="CUSTOMER">To Customer</option>
                  </select>
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Type comments or validation update details..."
                    className="flex-1 rounded-lg border border-input bg-background p-2 text-xs text-foreground focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={commentMutation.isPending || !commentText.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/95 p-2 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "recommendations" && (
            <Card className="shadow-xs border-border">
              <CardHeader>
                <CardTitle className="text-sm">Resolution Recommendations</CardTitle>
                <CardDescription>AI classification actions suggested by triage model.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isRecsLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : recommendations.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">No recommendations generated.</div>
                ) : (
                  recommendations.map((rec) => {
                    const parsed = parseRecommendationAction(rec.recommended_action);
                    return (
                    <div key={rec.id} className="p-4 border border-border rounded-lg bg-slate-50/50 dark:bg-zinc-950/10 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                        <div className="space-y-1">
                          <span className="text-muted-foreground">Suggested Action Outcome</span>
                          <p className="font-bold text-foreground text-sm uppercase">{parsed.outcome}</p>
                          {parsed.reasoning && (
                            <p className="text-muted-foreground leading-relaxed max-w-3xl">
                              {parsed.reasoning}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Confidence</span>
                            <Badge variant="warning" className="font-mono text-xs mt-0.5">
                              {formatConfidencePercent(rec.confidence)}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Generated</span>
                            <span className="font-semibold text-foreground mt-0.5 block">
                              {new Date(rec.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Agent</span>
                            <span className="font-semibold text-foreground font-mono mt-0.5 block">
                              {rec.created_by_agent}
                            </span>
                          </div>
                        </div>
                      </div>

                      {rec.recommended_invoice_json && (
                        <RecommendedInvoiceCard invoice={rec.recommended_invoice_json} />
                      )}
                    </div>
                  )})
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "communications" && (
            <Card className="shadow-xs border-border">
              <CardHeader>
                <CardTitle className="text-sm">Communications</CardTitle>
                <CardDescription>
                  Customer emails and internal department notifications for this dispute.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isCommsLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : allCommunications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">No correspondence found.</div>
                ) : (
                  allCommunications.map((comm) => {
                    const isExpanded = expandedCommId === comm.id;
                    const direction = getCommunicationDirection(comm);
                    const address = getCommunicationAddress(comm, customerEmail);
                    const typeLabel = getCommunicationTypeLabel(comm);
                    return (
                      <div
                        key={comm.id}
                        onClick={() => setExpandedCommId(isExpanded ? null : comm.id)}
                        className="p-3 border border-border rounded-lg bg-white dark:bg-zinc-950/20 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors text-xs"
                      >
                        <div className="flex justify-between items-center font-semibold text-foreground gap-3">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                            <Badge
                              variant={direction === "Sent" ? "default" : "outline"}
                              className="text-[9px] py-0 px-1.5 uppercase font-bold shrink-0"
                            >
                              {direction}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 uppercase font-bold shrink-0">
                              {typeLabel}
                            </Badge>
                            <span className="truncate text-[11px] font-mono text-muted-foreground">
                              {direction === "Sent" ? `To: ${address}` : `From: ${address}`}
                            </span>
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                            {getCommunicationTime(comm)
                              ? new Date(getCommunicationTime(comm)!).toLocaleString()
                              : "—"}
                          </span>
                        </div>
                        <div className="mt-1.5 text-foreground font-bold text-[13px]">{comm.subject}</div>
                        {isExpanded && (
                          <div className="mt-3 p-4 bg-slate-50 dark:bg-zinc-950/30 rounded border border-border whitespace-pre-wrap font-sans text-muted-foreground leading-relaxed text-xs">
                            {getCommunicationBody(comm)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "evidence" && (
            <Card className="shadow-xs border-border">
              <CardHeader>
                <CardTitle className="text-sm">Audit Evidence Snapshots</CardTitle>
                <CardDescription>System snapshots capturing state validation parameters.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isEvidenceLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : evidence.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground w-full col-span-2">
                    No evidence snapshots captured.
                  </div>
                ) : (
                  evidence.map((ev) => (
                    <Card key={ev.id} className="border border-border shadow-xs bg-slate-50/30">
                      <CardHeader className="p-3.5 pb-2 border-b border-border">
                        <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                          {ev.snapshot_type.replace("_", " ")}
                        </CardTitle>
                        <CardDescription className="text-[10px] font-mono">
                          Captured: {new Date(ev.created_at).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3">
                        <pre className="bg-slate-950 text-slate-100 p-3 rounded-lg overflow-x-auto text-[9px] font-mono leading-relaxed max-h-[150px] border border-slate-800">
                          {JSON.stringify(ev.snapshot_data, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "workflow" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left context detail */}
              <div className="md:col-span-2">
                <Card className="shadow-xs border-border">
                  <CardHeader>
                    <CardTitle className="text-sm">LangGraph Workflow Context State</CardTitle>
                    <CardDescription>Active execution schema properties.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isWfLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : !wfContext ? (
                      <div className="text-center py-6 text-xs text-muted-foreground">
                        No workflow context active.
                      </div>
                    ) : (
                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-muted-foreground font-semibold block">Workflow Name</span>
                            <span className="font-bold text-foreground mt-0.5 block">
                              {wfContext.workflow_name}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-semibold block">Current Executing Node</span>
                            <span className="font-bold text-primary mt-0.5 block font-mono">
                              {wfContext.current_node}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-semibold block">Last Executed Checkpoint</span>
                            <span className="font-bold text-foreground mt-0.5 block font-mono">
                              {wfContext.last_checkpoint || "None"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-semibold block">Execution Status</span>
                            <span className="font-bold text-foreground mt-0.5 block">
                              {wfContext.status || "WAITING"}
                            </span>
                          </div>
                        </div>

                        {/* Collapsible State details */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                            Full Workflow State Variables (JSON)
                          </span>
                          <pre className="bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-[9px] font-mono leading-relaxed border border-slate-800">
                            {JSON.stringify(wfContext.workflow_state, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right context logs */}
              <div>
                <Card className="shadow-xs border-border h-fit">
                  <CardHeader>
                    <CardTitle className="text-sm">Workflow Steps</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-foreground">Intake email received</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-foreground">AI Classification complete</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-foreground">Validation logic complete</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${dispute.status === "RESOLVED" || dispute.status === "CLOSED" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                      <span className="font-semibold text-foreground">Human decision audit</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisputeDetailPage;
