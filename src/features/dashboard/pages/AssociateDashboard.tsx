import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { invoiceService } from "@/features/invoices/services/invoiceService"
import { paymentService } from "@/features/payments/services/paymentService"
import { reviewService } from "@/features/matching/services/reviewService"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  FileText, 
  DollarSign, 
  FileCheck, 
  Clock, 
  HelpCircle, 
  ArrowRight,
  Inbox
} from "lucide-react"

export const AssociateDashboard: React.FC = () => {
  const navigate = useNavigate();

  // 1. Query all invoices
  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoiceService.getInvoices(),
  });

  // 2. Query payment uploads
  const { data: payments = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["paymentUploads"],
    queryFn: () => paymentService.listPaymentUploads(),
  });

  // 3. Query review queue
  const { data: reviews = [], isLoading: isReviewsLoading } = useQuery({
    queryKey: ["paymentReviews"],
    queryFn: () => reviewService.listPaymentReviews(),
  });

  // KPI Calculations
  const totalInvoices = invoices.length;
  const outstandingAmount = invoices.reduce((sum, inv) => sum + inv.outstanding_amount, 0);
  const totalPaymentsUploaded = payments.length;
  const paymentsProcessing = payments.filter(p => p.status === "UPLOADED" || p.status === "PROCESSING").length;
  const paymentsPendingReview = reviews.filter(r => r.status === "PENDING").length;

  const currencySymbol = invoices[0]?.currency || "INR";

  // Recent subsets
  const recentInvoices = invoices.slice(0, 5);
  const recentPayments = payments.slice(0, 5);
  const recentReviews = reviews.filter(r => r.status === "PENDING").slice(0, 5);

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            AR Operational Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Perform daily Accounts Receivable activities, upload invoices, ingest bank payments, and review matched items.
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Invoices</span>
              <p className="text-2xl font-bold text-foreground">
                {isInvoicesLoading ? <Skeleton className="h-7 w-12" /> : totalInvoices}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-850 text-slate-500">
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
                  `${currencySymbol} ${outstandingAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
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

      {/* Main Grid Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Pending Matching Reviews Queue (Full Width on single col, split row) */}
        <Card className="lg:col-span-2 shadow-xs border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border mb-4">
            <div>
              <CardTitle>Matching Review Requests</CardTitle>
              <CardDescription>Ingested payments with ambiguous matching confidence scores requiring human resolution.</CardDescription>
            </div>
            <Link to="/payment-reviews" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
              Open Queue <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {isReviewsLoading ? (
              <div className="space-y-2.5">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : recentReviews.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm flex flex-col items-center">
                <Inbox className="h-8 w-8 text-slate-300 mb-2" />
                Great job! Human matching review queue is currently empty.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                      <th className="pb-3 px-2">Review Date</th>
                      <th className="pb-3 px-2">Confidence</th>
                      <th className="pb-3 px-2">Review Reason</th>
                      <th className="pb-3 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentReviews.map((rev) => (
                      <tr
                        key={rev.id}
                        onClick={() => navigate("/payment-reviews")}
                        className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-2 text-muted-foreground">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-2 font-semibold">
                          <span className={`${
                            rev.confidence >= 90 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-500"
                          }`}>
                            {rev.confidence.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-muted-foreground truncate max-w-[280px]" title={rev.review_reason}>
                          {rev.review_reason}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <Badge variant="warning" className="text-[10px] py-0 px-2 uppercase font-bold">
                            {rev.status}
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
    </div>
  );
};

export default AssociateDashboard;
