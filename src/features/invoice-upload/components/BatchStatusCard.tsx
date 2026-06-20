import React from "react"
import { InvoiceUploadBatch } from "../types/invoiceUpload.types"
import { Calendar, FileCheck2, ShieldAlert, Loader2 } from "lucide-react"

interface BatchStatusCardProps {
  batch: InvoiceUploadBatch;
}

export const BatchStatusCard: React.FC<BatchStatusCardProps> = ({ batch }) => {
  const isProcessing = batch.status === "PROCESSING" || batch.status === "UPLOADED";
  const processedPercent = batch.total_files > 0
    ? Math.round((batch.processed_files / batch.total_files) * 100)
    : 0;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
      case "PARTIAL_SUCCESS":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
      case "FAILED":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
      case "PROCESSING":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
      default:
        return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-950/20 dark:text-zinc-400 dark:border-zinc-900/30";
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header Panel */}
      <div className="border-b border-border bg-zinc-50/50 dark:bg-zinc-900/10 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground m-0">Batch Status Dashboard</h2>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(batch.status)} flex items-center gap-1.5`}>
              {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
              {batch.status}
            </span>
          </div>
        </div>
        <div className="flex flex-col text-xs text-muted-foreground gap-1 md:text-right">
          <div className="flex items-center gap-1.5 md:justify-end">
            <Calendar className="h-3.5 w-3.5" />
            <span>Uploaded: {new Date(batch.uploaded_at).toLocaleString()}</span>
          </div>
          {batch.completed_at && (
            <div>Completed: {new Date(batch.completed_at).toLocaleString()}</div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Progress bar for background ingestion */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-foreground">
              <span>Ingestion Agent Extraction Progress</span>
              <span>{processedPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 animate-pulse"
                style={{ width: `${processedPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Ingestion Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 text-center shadow-xs">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Total Invoices</span>
            <span className="text-2xl font-bold text-foreground">{batch.total_files}</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center shadow-xs">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Processed</span>
            <span className="text-2xl font-bold text-foreground">{batch.processed_files}</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center shadow-xs">
            <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider block mb-1 flex items-center justify-center gap-1">
              <FileCheck2 className="h-3.5 w-3.5" /> Succeeded
            </span>
            <span className="text-2xl font-bold text-emerald-500">{batch.success_count}</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center shadow-xs">
            <span className="text-xs font-medium text-rose-500 uppercase tracking-wider block mb-1 flex items-center justify-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" /> Failed
            </span>
            <span className="text-2xl font-bold text-rose-500">{batch.failed_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
