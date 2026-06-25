import React, { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { RootState } from "@/app/store"
import { Link, useNavigate } from "react-router-dom"
import { invoiceService } from "@/features/invoices/services/invoiceService"
import { paymentService } from "@/features/payments/services/paymentService"
import { reviewService } from "@/features/matching/services/reviewService"
import {
  useOpenCollections,
  useAssignedCases,
  useBrokenPromises,
  useCollectionAnalytics,
  useAgingAnalytics,
  useReminderHistory,
  usePromises,
} from "@/features/collections/hooks/useCollections"
import { useDisputes, useReviewQueue } from "@/features/disputes/hooks/useDisputes"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card"
import { ChartCard } from "@/components/ui/chart-card"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Timeline, TimelineItem } from "@/components/ui/timeline"
import { Button } from "@/components/ui/button"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { CHART_COLORS } from "@/lib/design-tokens"
import {
  FileText,
  DollarSign,
  FileCheck,
  Clock,
  HelpCircle,
  ArrowRight,
  FolderOpen,
  HeartOff,
  AlertTriangle,
  UserCheck,
  Mail,
  Calendar,
} from "lucide-react"

export const AssociateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoiceService.getInvoices(),
  });

  const { data: payments = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["paymentUploads"],
    queryFn: () => paymentService.listPaymentUploads(),
  });

  const { data: reviews = [], isLoading: isReviewsLoading } = useQuery({
    queryKey: ["paymentReviews"],
    queryFn: () => reviewService.listPaymentReviews(),
  });

  const { data: openCases = [], isLoading: isOpenCasesLoading } = useOpenCollections();
  const { data: assignedCases = [], isLoading: isAssignedCasesLoading } = useAssignedCases();
  const { data: brokenPromisesCases = [], isLoading: isBrokenPromisesLoading } = useBrokenPromises();
  const { isLoading: isAnalyticsLoading } = useCollectionAnalytics();
  const { data: aging, isLoading: isAgingLoading } = useAgingAnalytics();
  const { data: reminders = [], isLoading: isRemindersLoading } = useReminderHistory();
  const { data: promises = [], isLoading: isPromisesLoading } = usePromises();

  const { data: disputes = [], isLoading: isDisputesLoading } = useDisputes();
  const { data: reviewQueue = [], isLoading: isDisputesReviewLoading } = useReviewQueue("PENDING");

  const totalInvoices = invoices.length;
  const outstandingAmount = invoices.reduce((sum, inv) => sum + inv.outstanding_amount, 0);
  const totalPaymentsUploaded = payments.length;
  const paymentsProcessing = payments.filter((p) => p.status === "UPLOADED" || p.status === "PROCESSING").length;
  const paymentsPendingReview = reviews.filter((r) => r.status === "PENDING").length;

  const recentInvoices = invoices.slice(0, 5);
  const recentPayments = payments.slice(0, 5);

  const recentEscalations = useMemo(() => {
    return assignedCases
      .filter((c) => c.status === "ESCALATED")
      .sort((a, b) => {
        const dateA = a.escalated_at ? new Date(a.escalated_at).getTime() : 0;
        const dateB = b.escalated_at ? new Date(b.escalated_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [assignedCases]);

  const recentActivities = useMemo(() => {
    const items: Array<{
      id: string;
      type: "REMINDER" | "PROMISE";
      title: string;
      description: string;
      date: string;
      caseId: string;
    }> = [];

    reminders.forEach((r) => {
      items.push({
        id: r.id,
        type: "REMINDER",
        title: `Reminder #${r.reminder_number} ${r.status}`,
        description: `Subject: ${r.subject} sent to ${r.sent_to}`,
        date: r.sent_at || r.created_at,
        caseId: r.collection_case_id,
      });
    });

    promises.forEach((p) => {
      items.push({
        id: p.id,
        type: "PROMISE",
        title: `Promise ${p.status}`,
        description: `Amount: ₹${p.promised_amount.toLocaleString()} due on ${new Date(
          p.promised_date
        ).toLocaleDateString()}`,
        date: p.created_at,
        caseId: p.collection_case_id,
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [reminders, promises]);

  const agingChartData = useMemo(() => {
    if (!aging) return [];
    return [
      { name: "Current", Amount: aging.CURRENT },
      { name: "0-30", Amount: aging["0-30"] },
      { name: "31-60", Amount: aging["31-60"] },
      { name: "61-90", Amount: aging["61-90"] },
      { name: "90+", Amount: aging["90_PLUS"] || 0 },
    ];
  }, [aging]);

  const getInvoiceStatusVariant = (status: string) => {
    switch (status) {
      case "PAID": return "success";
      case "PARTIALLY_PAID": return "info";
      case "PENDING": return "default";
      case "OVERDUE": return "destructive";
      case "DISPUTED": return "warning";
      default: return "outline";
    }
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case "MATCHED": return "success";
      case "PROCESSING": return "info";
      case "UPLOADED": return "default";
      case "REVIEW_REQUIRED": return "warning";
      case "FAILED": return "destructive";
      default: return "outline";
    }
  };

  const isCollectionsLoading =
    isOpenCasesLoading ||
    isAssignedCasesLoading ||
    isBrokenPromisesLoading ||
    isAnalyticsLoading ||
    isAgingLoading ||
    isRemindersLoading ||
    isPromisesLoading;

  const escalatedCount = assignedCases.filter((c) => c.status === "ESCALATED").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="AR Operational Dashboard"
        description="Perform daily Accounts Receivable activities, upload invoices, ingest bank payments, and review collections."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate("/invoice-upload")}>
              Upload Invoices
            </Button>
            <Button size="sm" onClick={() => navigate("/payment-upload")}>
              Upload Payments
            </Button>
          </>
        }
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Accounts receivable</h2>
        <KpiGrid columns={5}>
          <KpiCard
            label="Total invoices"
            value={totalInvoices}
            loading={isInvoicesLoading}
            icon={<FileText className="h-5 w-5" />}
            iconTone="default"
          />
          <KpiCard
            label="Outstanding"
            value={`₹${outstandingAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            loading={isInvoicesLoading}
            icon={<DollarSign className="h-5 w-5" />}
            iconTone="destructive"
          />
          <KpiCard
            label="Uploaded payments"
            value={totalPaymentsUploaded}
            loading={isPaymentsLoading}
            icon={<FileCheck className="h-5 w-5" />}
            iconTone="success"
          />
          <KpiCard
            label="Processing"
            value={paymentsProcessing}
            loading={isPaymentsLoading}
            icon={<Clock className="h-5 w-5" />}
            iconTone="info"
          />
          <KpiCard
            label="Pending review"
            value={paymentsPendingReview}
            loading={isReviewsLoading}
            icon={<HelpCircle className="h-5 w-5" />}
            iconTone="warning"
          />
        </KpiGrid>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Collections</h2>
        <KpiGrid>
          <KpiCard
            label="Open collection cases"
            value={openCases.length}
            loading={isCollectionsLoading}
            icon={<FolderOpen className="h-5 w-5" />}
            iconTone="info"
          />
          <KpiCard
            label="My assigned cases"
            value={assignedCases.length}
            loading={isCollectionsLoading}
            icon={<UserCheck className="h-5 w-5" />}
            iconTone="warning"
          />
          <KpiCard
            label="Broken promises"
            value={brokenPromisesCases.length}
            loading={isCollectionsLoading}
            icon={<HeartOff className="h-5 w-5" />}
            iconTone="destructive"
          />
          <KpiCard
            label="Escalated cases"
            value={escalatedCount}
            loading={isCollectionsLoading}
            icon={<AlertTriangle className="h-5 w-5" />}
            iconTone="destructive"
          />
        </KpiGrid>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Disputes</h2>
        <KpiGrid>
          <KpiCard
            label="My open disputes"
            value={disputes.filter((d) => d.assigned_to === user?.sub && d.status === "OPEN").length}
            loading={isDisputesLoading}
            icon={<AlertTriangle className="h-5 w-5" />}
            iconTone="info"
          />
          <KpiCard
            label="Waiting customer"
            value={disputes.filter((d) => d.status === "WAITING_CUSTOMER").length}
            loading={isDisputesLoading}
            icon={<UserCheck className="h-5 w-5" />}
            iconTone="warning"
          />
          <KpiCard
            label="Waiting internal team"
            value={disputes.filter((d) => d.status === "WAITING_INTERNAL").length}
            loading={isDisputesLoading}
            icon={<Clock className="h-5 w-5" />}
            iconTone="warning"
          />
          <KpiCard
            label="Review queue count"
            value={reviewQueue.length}
            loading={isDisputesReviewLoading}
            icon={<HelpCircle className="h-5 w-5" />}
            iconTone="warning"
          />
        </KpiGrid>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border shadow-xs">
            <CardHeader className="mb-4 flex flex-row items-center justify-between border-b border-border pb-3">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Latest open billing items.</CardDescription>
              </div>
              <Link to="/invoices" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {isInvoicesLoading ? (
                <div className="space-y-2.5">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : recentInvoices.length === 0 ? (
                <EmptyState title="No invoices yet" description="No invoices imported yet." className="py-6" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th scope="col" className="px-2 pb-3">Invoice Number</th>
                        <th scope="col" className="px-2 pb-3">Invoice Date</th>
                        <th scope="col" className="px-2 pb-3 text-right">Amount</th>
                        <th scope="col" className="px-2 pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentInvoices.map((inv) => (
                        <tr
                          key={inv.id}
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="cursor-pointer transition-colors hover:bg-muted/40"
                        >
                          <td className="px-2 py-2.5 font-semibold text-foreground">{inv.invoice_number}</td>
                          <td className="px-2 py-2.5 text-muted-foreground">
                            {new Date(inv.invoice_date).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-2.5 text-right font-bold tabular-nums">
                            {inv.currency} {inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-2 py-2.5 text-right">
                            <Badge variant={getInvoiceStatusVariant(inv.status)} className="px-2 py-0 text-[10px] font-bold uppercase">
                              {inv.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardHeader className="mb-4 flex flex-row items-center justify-between border-b border-border pb-3">
              <div>
                <CardTitle>Recent Payment Uploads</CardTitle>
                <CardDescription>Processed receipts and matches.</CardDescription>
              </div>
              <Link to="/payment-upload-history" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                View History <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {isPaymentsLoading ? (
                <div className="space-y-2.5">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : recentPayments.length === 0 ? (
                <EmptyState title="No payments yet" description="No payment documents ingested yet." className="py-6" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th scope="col" className="px-2 pb-3">File Name</th>
                        <th scope="col" className="px-2 pb-3">Upload Date</th>
                        <th scope="col" className="px-2 pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentPayments.map((pay) => (
                        <tr
                          key={pay.id}
                          onClick={() => navigate(`/payment-upload/${pay.id}`)}
                          className="cursor-pointer transition-colors hover:bg-muted/40"
                        >
                          <td className="max-w-[180px] truncate px-2 py-2.5 font-semibold text-foreground" title={pay.file_name}>
                            {pay.file_name}
                          </td>
                          <td className="px-2 py-2.5 text-muted-foreground">
                            {new Date(pay.uploaded_at).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-2.5 text-right">
                            <Badge variant={getPaymentStatusVariant(pay.status)} className="px-2 py-0 text-[10px] font-bold uppercase">
                              {pay.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ChartCard
            title="Aging distribution"
            description="Outstanding balance by bucket."
            loading={isCollectionsLoading}
            empty={
              agingChartData.length === 0 || agingChartData.every((d) => d.Amount === 0)
                ? { title: "No aging data", description: "No active collection aging data." }
                : false
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} fontWeight={600} />
                <YAxis
                  fontSize={10}
                  fontWeight={600}
                  tickFormatter={(v) => `₹${v.toLocaleString(undefined, { notation: "compact" })}`}
                />
                <Tooltip formatter={(v: number | string) => [`₹${Number(v).toLocaleString()}`, "Outstanding"]} />
                <Bar dataKey="Amount" fill={CHART_COLORS[2]} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <Card className="border-border shadow-xs">
            <CardHeader className="mb-3 border-b border-border pb-3">
              <CardTitle className="text-sm">Recent Activities</CardTitle>
              <CardDescription>Recent dunning dispatches and promises.</CardDescription>
            </CardHeader>
            <CardContent>
              {isCollectionsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : recentActivities.length === 0 ? (
                <EmptyState
                  title="No activities yet"
                  description="No collection activities recorded yet."
                  className="py-4"
                />
              ) : (
                <Timeline>
                  {recentActivities.map((act) => (
                    <TimelineItem
                      key={act.id}
                      tone="default"
                      icon={
                        act.type === "REMINDER" ? (
                          <Mail className="h-2.5 w-2.5" />
                        ) : (
                          <Calendar className="h-2.5 w-2.5" />
                        )
                      }
                      title={
                        <Link to={`/collections/${act.caseId}`} className="hover:text-primary hover:underline">
                          {act.title}
                        </Link>
                      }
                      timestamp={new Date(act.date).toLocaleDateString()}
                      description={act.description}
                    />
                  ))}
                </Timeline>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardHeader className="mb-3 border-b border-border pb-3">
              <CardTitle className="text-sm">Recent Escalations</CardTitle>
              <CardDescription>Your assigned cases escalated to managers.</CardDescription>
            </CardHeader>
            <CardContent>
              {isCollectionsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : recentEscalations.length === 0 ? (
                <EmptyState
                  title="No escalations"
                  description="None of your assigned cases are currently escalated."
                  className="py-4"
                />
              ) : (
                <div className="space-y-2">
                  {recentEscalations.map((esc) => (
                    <div
                      key={esc.id}
                      onClick={() => navigate(`/collections/${esc.id}`)}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-2 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">
                          {esc.customer?.customer_name}
                        </p>
                        <p className="mt-0.5 text-[9px] text-muted-foreground">
                          Invoice: {esc.invoice?.invoice_number || "N/A"}
                        </p>
                      </div>
                      <Badge variant="destructive" className="shrink-0 px-1.5 py-0 text-[9px] font-bold uppercase">
                        Escalated
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssociateDashboard;
