import React from "react"
import { InvoiceUploadBatch } from "../types/invoiceUpload.types"
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react"

interface UploadSummaryProps {
  batch: InvoiceUploadBatch;
}

export const UploadSummary: React.FC<UploadSummaryProps> = ({ batch }) => {
  if (batch.status === "PROCESSING" || batch.status === "UPLOADED") {
    return null;
  }

  return (
    <div className="w-full">
      {batch.status === "COMPLETED" && (
        <div className="flex items-start gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-900/30 p-5 shadow-xs">
          <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-foreground">Batch Import Completed Successfully</h4>
            <p className="text-sm text-muted-foreground">
              All {batch.total_files} invoice(s) were successfully parsed, resolved, and registered in the accounts receivable ledger.
            </p>
          </div>
        </div>
      )}

      {batch.status === "PARTIAL_SUCCESS" && (
        <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900/30 p-5 shadow-xs">
          <div className="rounded-full bg-amber-500/10 p-2 text-amber-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-foreground">Import Partial Success</h4>
            <p className="text-sm text-muted-foreground">
              Some files failed processing: **{batch.success_count}** succeeded and **{batch.failed_count}** were sent to the review queue. Please verify the issues below.
            </p>
          </div>
        </div>
      )}

      {batch.status === "FAILED" && (
        <div className="flex items-start gap-4 rounded-xl border border-rose-200 bg-rose-50/50 dark:bg-rose-950/10 dark:border-rose-900/30 p-5 shadow-xs">
          <div className="rounded-full bg-rose-500/10 p-2 text-rose-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-foreground">Batch Import Failed</h4>
            <p className="text-sm text-muted-foreground">
              All {batch.total_files} file(s) failed validation or parsing. The entire batch has been routed to the manual review queue.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
