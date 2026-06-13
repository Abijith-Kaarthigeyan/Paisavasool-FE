import React from "react"
import { useNavigate } from "react-router-dom"
import { usePaymentUploads } from "../hooks/usePayments"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Inbox } from "lucide-react"
import { PaymentUploadResponse } from "../types"

export const PaymentUploadHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  // Load payment uploads, auto-refreshes every 10 seconds
  const { 
    data: uploadsData, 
    isLoading, 
    isError, 
    refetch 
  } = usePaymentUploads(undefined, {
    refetchInterval: 10000,
  });

  const uploads = (uploadsData || []) as PaymentUploadResponse[];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "MATCHED": return "success";
      case "PROCESSING": return "info";
      case "UPLOADED": return "default";
      case "REVIEW_REQUIRED": return "warning";
      case "FAILED": return "destructive";
      default: return "outline";
    }
  };

  const handleRowClick = (uploadId: string) => {
    navigate(`/payment-upload/${uploadId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
            Payment Upload History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review ingested payment documents, check processing statuses, and view match configurations. Page refreshes every 10s.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Force Refresh
        </button>
      </header>

      {/* History table */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : isError ? (
            <div className="p-12 text-center space-y-4">
              <Inbox className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-base font-bold text-foreground">Failed to Load History</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Unable to retrieve the list of payment uploads. Please check the backend connectivity.
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Try Again
              </button>
            </div>
          ) : uploads.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Inbox className="h-12 w-12 text-slate-350 mx-auto" />
              <p className="text-sm text-muted-foreground font-semibold">No payment documents have been uploaded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-xs font-semibold bg-slate-50/50 dark:bg-zinc-900/10">
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Uploaded At</th>
                    <th className="py-3 px-4">Uploaded By</th>
                    <th className="py-3 px-4 text-right">Ingestion Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {uploads.map((pay) => (
                    <tr
                      key={pay.id}
                      onClick={() => handleRowClick(pay.id)}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-foreground truncate max-w-[280px]" title={pay.file_name}>
                        {pay.file_name}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {new Date(pay.uploaded_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-semibold">
                        Finance Associate
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Badge variant={getStatusBadgeVariant(pay.status)} className="text-[10px] py-0.5 px-2.5 uppercase font-bold tracking-wider">
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
  );
};

export default PaymentUploadHistoryPage;
