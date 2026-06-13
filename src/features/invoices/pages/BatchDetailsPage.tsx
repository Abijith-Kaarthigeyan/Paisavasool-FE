import React from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useBatchStatus, useBatchInvoices } from "../hooks/useInvoices"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ArrowLeft,
  Calendar,
  Layers
} from "lucide-react"

export const BatchDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch status details (polled automatically every 2s until completed)
  const { data: batch, isLoading: isBatchLoading, error: batchError } = useBatchStatus(id);

  // Fetch successful invoices for this batch
  const { data: invoices = [], isLoading: isInvoicesLoading } = useBatchInvoices(id);

  const getBatchStatusVariant = (status: string | undefined) => {
    switch (status) {
      case "COMPLETED": return "success";
      case "PARTIAL_SUCCESS": return "info";
      case "PROCESSING": return "default";
      case "UPLOADED": return "secondary";
      case "FAILED": return "destructive";
      default: return "outline";
    }
  };

  const formatStatus = (status: string | undefined) => {
    if (!status) return "";
    return status.replace("_", " ");
  };

  if (isBatchLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (batchError || !batch) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <XCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Failed to Load Batch</h3>
        <p className="text-sm text-muted-foreground">The batch details could not be found. It may be deleted or does not exist.</p>
        <Link to="/invoice-upload" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Upload Center
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to="/invoice-upload" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
              Batch Ingestion Details
            </h1>
          </div>
        </div>
        <div>
          <Badge variant={getBatchStatusVariant(batch.status)} className="text-xs uppercase px-3 py-1 font-bold tracking-wider">
            {formatStatus(batch.status)}
          </Badge>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Invoices</span>
              <p className="text-2xl font-bold text-foreground">{batch.total_files}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Successful Ingestion</span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{batch.success_count}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Failed Ingestion</span>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{batch.failed_count}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Uploaded At</span>
              <p className="text-sm font-semibold text-foreground mt-1 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                {new Date(batch.uploaded_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploading Status Overlay Info */}
      {(batch.status === "UPLOADED" || batch.status === "PROCESSING") && (
        <Card className="border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-400">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            <p className="text-sm font-semibold m-0">
              AI model is currently extracting line items from this batch ({batch.processed_files}/{batch.total_files} files complete). Updates occur automatically.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Successfully Imported Invoices Table */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border mb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" /> Successfully Imported Invoices
          </CardTitle>
          <CardDescription>Lines parsed and saved to billing registers.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isInvoicesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-lg">
              {batch.status === "FAILED" ? "Ingestion failed. No invoices imported." : "No invoices successfully processed in this batch yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-xs font-semibold">
                    <th className="py-3 px-3">Invoice Number</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Invoice Date</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3 text-right">Outstanding</th>
                    <th className="py-3 px-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-semibold text-foreground">{inv.invoice_number}</td>
                      <td className="py-3 px-3 text-muted-foreground font-semibold">
                        {inv.customer?.customer_name || "Active Account"}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                      <td className="py-3 px-3 text-muted-foreground">{new Date(inv.due_date).toLocaleDateString()}</td>
                      <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                        {inv.currency} {inv.outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-foreground font-mono">
                        {inv.currency} {inv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
  );
};

export default BatchDetailsPage;
