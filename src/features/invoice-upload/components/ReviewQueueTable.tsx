import React from "react"
import { ReviewQueueItem } from "../types/invoiceUpload.types"
import { AlertTriangle, Clock } from "lucide-react"

interface ReviewQueueTableProps {
  items: ReviewQueueItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export const ReviewQueueTable: React.FC<ReviewQueueTableProps> = ({
  items,
  isLoading,
  isError,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground">Review Queue Items</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-8 rounded bg-zinc-100 dark:bg-zinc-800 w-full" />
          <div className="h-14 rounded bg-zinc-50 dark:bg-zinc-900/50 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-rose-500 shadow-sm">
        Failed to load review queue.
      </div>
    );
  }

  const list = items || [];

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case "EXTRACTION_FAILED":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400";
      case "DUPLICATE_INVOICE":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400";
      case "INVALID_TOTAL":
      case "INVALID_DATE":
      case "VALIDATION_FAILED":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400";
      default:
        return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-950/20 dark:text-zinc-400";
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h3 className="text-base font-bold text-foreground m-0">Invoices Requiring Manual Review</h3>
      </div>

      {list.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          No files requiring review in this batch.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-xs font-semibold">
                <th className="py-3 px-2">Invoice Record</th>
                <th className="py-3 px-2">Review Reason</th>
                <th className="py-3 px-2">Queue Status</th>
                <th className="py-3 px-2">Discovered At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                  <td className="py-3 px-2 font-medium text-foreground">
                    <span className="font-semibold">Flagged Invoice</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getReasonBadge(item.review_reason)}`}>
                      {item.review_reason}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                      <Clock className="h-3 w-3 animate-pulse text-amber-500" /> {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
