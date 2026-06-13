import React from "react"
import { useParams, Link } from "react-router-dom"
import { useSelector } from "react-redux"
import { RootState } from "@/app/store"
import { useBatchStatus } from "../hooks/useBatchStatus"
import { useBatchInvoices } from "../hooks/useInvoices"
import { useReviewQueue } from "../hooks/useReviewQueue"
import { BatchStatusCard } from "../components/BatchStatusCard"
import { InvoiceTable } from "../components/InvoiceTable"
import { ReviewQueueTable } from "../components/ReviewQueueTable"
import { UploadSummary } from "../components/UploadSummary"
import { ChevronRight, Home, RefreshCw } from "lucide-react"

export const BatchDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useSelector((state: RootState) => state.auth);

  // Queries
  const { data: batch, isLoading: isBatchLoading, isError: isBatchError, refetch: refetchBatch } = useBatchStatus(id);
  const { data: invoices, isLoading: isInvoicesLoading, isError: isInvoicesError, refetch: refetchInvoices } = useBatchInvoices(id);
  const { data: reviewItems, isLoading: isReviewLoading, isError: isReviewError, refetch: refetchReview } = useReviewQueue();

  // Redirect link depending on active user role
  const getDashboardPath = () => {
    if (!user) return "/login";
    if (user.role === "ADMIN") return "/admin";
    if (user.role === "FINANCE_MANAGER") return "/manager";
    return "/associate";
  };

  const handleRefresh = () => {
    refetchBatch();
    refetchInvoices();
    refetchReview();
  };

  // Filter review queue items for this batch
  const batchReviewItems = reviewItems ? reviewItems.filter(item => item.batch_id === id) : [];

  if (isBatchLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (isBatchError || !batch) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 flex items-center justify-center">
        <div className="max-w-md text-center bg-card border border-border rounded-xl p-8 space-y-4 shadow-sm">
          <h2 className="text-xl font-bold text-rose-500">Batch Error</h2>
          <p className="text-sm text-muted-foreground">
            Failed to retrieve upload batch details. Please verify the batch ID or connection.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/invoice-upload" className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Back to Upload
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-sans">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-xs text-muted-foreground bg-card px-4 py-2.5 rounded-lg border border-border w-fit shadow-xs">
          <Link to={getDashboardPath()} className="flex items-center gap-1 hover:text-primary transition-colors">
            <Home className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/invoice-upload" className="hover:text-primary transition-colors">
            Invoice Upload
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-foreground">Batch Details</span>
        </nav>

        {/* Header Dashboard section */}
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
              Batch details: {batch.file_name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Verify AI ingestion outputs, resolution counters, and validation errors.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="rounded border border-border bg-card p-2 text-muted-foreground hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              title="Refresh status"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <Link
              to="/invoice-upload"
              className="rounded bg-secondary border border-border px-4 py-2 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Upload Another File
            </Link>
          </div>
        </header>

        {/* Upload summary banner alerts */}
        <UploadSummary batch={batch} />

        {/* Status Card metrics */}
        <BatchStatusCard batch={batch} />

        {/* Invoices list and review tables */}
        <div className="grid grid-cols-1 gap-6">
          <InvoiceTable
            invoices={invoices}
            isLoading={isInvoicesLoading}
            isError={isInvoicesError}
          />

          <ReviewQueueTable
            items={batchReviewItems}
            isLoading={isReviewLoading}
            isError={isReviewError}
          />
        </div>

      </div>
    </div>
  );
};
