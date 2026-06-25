import React from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { RootState } from "@/app/store"
import { useBatchStatus } from "../hooks/useBatchStatus"
import { useBatchInvoices } from "../hooks/useInvoices"
import { useReviewQueue } from "../hooks/useReviewQueue"
import { BatchStatusCard } from "../components/BatchStatusCard"
import { InvoiceTable } from "../components/InvoiceTable"
import { ReviewQueueTable } from "../components/ReviewQueueTable"
import { UploadSummary } from "../components/UploadSummary"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight, Home, RefreshCw } from "lucide-react"

export const BatchDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)

  const {
    data: batch,
    isLoading: isBatchLoading,
    isError: isBatchError,
    refetch: refetchBatch,
  } = useBatchStatus(id)
  const {
    data: invoices,
    isLoading: isInvoicesLoading,
    isError: isInvoicesError,
    refetch: refetchInvoices,
  } = useBatchInvoices(id)
  const {
    data: reviewItems,
    isLoading: isReviewLoading,
    isError: isReviewError,
    refetch: refetchReview,
  } = useReviewQueue()

  const getDashboardPath = () => {
    if (!user) return "/login"
    if (user.role === "ADMIN") return "/admin"
    if (user.role === "FINANCE_MANAGER") return "/manager"
    return "/associate"
  }

  const handleRefresh = () => {
    refetchBatch()
    refetchInvoices()
    refetchReview()
  }

  const batchReviewItems = reviewItems ? reviewItems.filter((item) => item.batch_id === id) : []

  if (isBatchLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isBatchError || !batch) {
    return (
      <div className="mx-auto max-w-md py-12">
        <EmptyState
          title="Batch error"
          description="Failed to retrieve upload batch details. Please verify the batch ID or connection."
          action={
            <Button variant="primary" size="sm" onClick={() => navigate("/invoice-upload")}>
              Back to upload
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <nav
        className="flex w-fit flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link
          to={getDashboardPath()}
          className="flex items-center gap-1 transition-colors hover:text-foreground"
        >
          <Home className="h-3.5 w-3.5" aria-hidden />
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <Link to="/invoice-upload" className="transition-colors hover:text-foreground">
          Invoice upload
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="font-medium text-foreground">Batch details</span>
      </nav>

      <PageHeader
        title={`Batch details: ${batch.file_name}`}
        description="Verify AI ingestion outputs, resolution counters, and validation errors."
        actions={
          <div className="flex gap-2">
            <Button
              variant="icon"
              size="sm"
              onClick={handleRefresh}
              title="Refresh status"
              aria-label="Refresh status"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate("/invoice-upload")}>
              Upload another file
            </Button>
          </div>
        }
      />

      <UploadSummary batch={batch} />
      <BatchStatusCard batch={batch} />

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
  )
}
