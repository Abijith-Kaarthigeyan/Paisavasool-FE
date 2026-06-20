import React, { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
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

  // 1. Existing queries
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

  // 2. New Collections queries
  const { data: openCases = [], isLoading: isOpenCasesLoading } = useOpenCollections();
  const { data: assignedCases = [], isLoading: isAssignedCasesLoading } = useAssignedCases();
  const { data: brokenPromisesCases = [], isLoading: isBrokenPromisesLoading } = useBrokenPromises();
  const { isLoading: isAnalyticsLoading } = useCollectionAnalytics();
  const { data: aging, isLoading: isAgingLoading } = useAgingAnalytics();
  const { data: reminders = [], isLoading: isRemindersLoading } = useReminderHistory();
  const { data: promises = [], isLoading: isPromisesLoading } = usePromises();

  const totalInvoices = invoices.length;
  const outstandingAmount = invoices.reduce((sum, inv) => sum + inv.outstanding_amount, 0);
  const totalPaymentsUploaded = payments.length;
  const paymentsProcessing = payments.filter((p) => p.status === "UPLOADED" || p.status === "PROCESSING").length;
  const paymentsPendingReview = reviews.filter((r) => r.status === "PENDING").length;


  // Recent subsets
  const recentInvoices = invoices.slice(0, 5);
  const recentPayments = payments.slice(0, 5);

  // Filter out recent escalations assigned to this associate
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

  // Merge reminders and promises into a unified recent activities timeline
  const recentActivities = useMemo(() => {
    const items: Array<{
      id: string;
      type: "REMINDER" | "PROMISE";
      title: string;
      description: string;
      date: string;
      caseId: string;
    }> = [];

    // Map reminders
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

    // Map promises
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

  // Aging distribution chart data
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            AR Operational Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Perform daily Accounts Receivable activities, upload invoices, ingest bank payments, and review collections.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/invoice-upload"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            Upload Invoices
          </Link>
          <Link
            to="/payment-upload"
            className="rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors shadow-xs"
          >
            Upload Payments
          </Link>
        </div>
      </header>

      {/* Primary KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Invoices</span>
              <p className="text-2xl font-bold text-foreground">
                {isInvoicesLoading ? <Skeleton className="h-7 w-12" /> : totalInvoices}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Outstanding</span>
              <p className="text-2xl font-bold text-foreground">
                {isInvoicesLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  `₹${outstandingAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                )}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Uploaded Payments</span>
              <p className="text-2xl font-bold text-foreground">
                {isPaymentsLoading ? <Skeleton className="h-7 w-12" /> : totalPaymentsUploaded}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <FileCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Processing</span>
              <p className="text-2xl font-bold text-foreground">
                {isPaymentsLoading ? <Skeleton className="h-7 w-12" /> : paymentsProcessing}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Review</span>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {isReviewsLoading ? <Skeleton className="h-7 w-12" /> : paymentsPendingReview}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
              <HelpCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Collections KPI Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Open Collection Cases
              </span>
              <p className="text-xl font-bold text-foreground">
                {isCollectionsLoading ? <Skeleton className="h-6 w-10" /> : openCases.length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <FolderOpen className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                My Assigned Cases
              </span>
              <p className="text-xl font-bold text-foreground">
                {isCollectionsLoading ? <Skeleton className="h-6 w-10" /> : assignedCases.length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <UserCheck className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Broken Promises
              </span>
              <p className="text-xl font-bold text-rose-500">
                {isCollectionsLoading ? <Skeleton className="h-6 w-10" /> : brokenPromisesCases.length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
              <HeartOff className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Escalated Cases
              </span>
              <p className="text-xl font-bold text-red-500 font-mono">
                {isCollectionsLoading ? (
                  <Skeleton className="h-6 w-10" />
                ) : (
                  assignedCases.filter((c) => c.status === "ESCALATED").length
                )}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Recent Invoices & Payments (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Invoices */}
          <Card className="shadow-xs border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border mb-4">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Latest open billing items.</CardDescription>
              </div>
              <Link to="/invoices" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
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
                <div className="text-center py-10 text-muted-foreground text-xs">
                  No invoices imported yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                        <th className="pb-3 px-2">Invoice Number</th>
                        <th className="pb-3 px-2">Invoice Date</th>
                        <th className="pb-3 px-2 text-right">Amount</th>
                        <th className="pb-3 px-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentInvoices.map((inv) => (
                        <tr
                          key={inv.id}
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-2 font-semibold text-foreground">{inv.invoice_number}</td>
                          <td className="py-2.5 px-2 text-muted-foreground">
                            {new Date(inv.invoice_date).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold font-mono">
                            {inv.currency} {inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <Badge variant={getInvoiceStatusVariant(inv.status)} className="text-[10px] py-0 px-2 uppercase font-bold">
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

          {/* Recent Payment Uploads */}
          <Card className="shadow-xs border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border mb-4">
              <div>
                <CardTitle>Recent Payment Uploads</CardTitle>
                <CardDescription>Processed receipts and matches.</CardDescription>
              </div>
              <Link to="/payment-upload-history" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
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
                <div className="text-center py-10 text-muted-foreground text-xs">
                  No payment documents ingested yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                        <th className="pb-3 px-2">File Name</th>
                        <th className="pb-3 px-2">Upload Date</th>
                        <th className="pb-3 px-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentPayments.map((pay) => (
                        <tr
                          key={pay.id}
                          onClick={() => navigate(`/payment-upload/${pay.id}`)}
                          className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-2 font-semibold text-foreground truncate max-w-[180px]" title={pay.file_name}>
                            {pay.file_name}
                          </td>
                          <td className="py-2.5 px-2 text-muted-foreground">
                            {new Date(pay.uploaded_at).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <Badge variant={getPaymentStatusVariant(pay.status)} className="text-[10px] py-0 px-2 uppercase font-bold">
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

        {/* Right Side: Charts & Timelines (1 Col) */}
        <div className="space-y-6">
          {/* Aging Distribution Chart Widget */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 border-b border-border mb-3">
              <CardTitle className="text-sm">Aging Distribution</CardTitle>
              <CardDescription>Outstanding balance by bucket.</CardDescription>
            </CardHeader>
            <CardContent>
              {isCollectionsLoading ? (
                <Skeleton className="h-44 w-full" />
              ) : agingChartData.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
                  No active collection aging data.
                </div>
              ) : (
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agingChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={10} fontWeight={600} />
                      <YAxis
                        fontSize={10}
                        fontWeight={600}
                        tickFormatter={(v) => `₹${v.toLocaleString(undefined, { notation: "compact" })}`}
                      />
                      <Tooltip formatter={(v: any) => [`₹${v.toLocaleString()}`, "Outstanding"]} />
                      <Bar dataKey="Amount" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Collection Activities Timeline */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 border-b border-border mb-3">
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
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No collection activities recorded yet.
                </div>
              ) : (
                <div className="relative pl-4 border-l border-border space-y-4 text-xs">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="relative">
                      <span className="absolute -left-[23px] top-0.5 rounded-full p-1 bg-slate-100 dark:bg-zinc-800 text-slate-500">
                        {act.type === "REMINDER" ? <Mail className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                      </span>
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground hover:underline">
                            <Link to={`/collections/${act.caseId}`}>{act.title}</Link>
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(act.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                          {act.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Escalations */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3 border-b border-border mb-3">
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
                <div className="text-center py-6 text-muted-foreground text-xs">
                  None of your assigned cases are currently escalated.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentEscalations.map((esc) => (
                    <div
                      key={esc.id}
                      onClick={() => navigate(`/collections/${esc.id}`)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900/40 cursor-pointer border border-border transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {esc.customer?.customer_name}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          Invoice: {esc.invoice?.invoice_number || "N/A"}
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-[9px] py-0 px-1.5 uppercase font-bold flex-shrink-0">
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
