import React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useBatchStatus } from "../hooks/useBatchStatus"
import { useBatchInvoices } from "../hooks/useInvoices"
import { useReviewQueue } from "../hooks/useReviewQueue"
import { BatchStatusCard } from "../components/BatchStatusCard"
import { InvoiceTable } from "../components/InvoiceTable"
import { ReviewQueueTable } from "../components/ReviewQueueTable"
import { UploadSummary } from "../components/UploadSummary"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { getDashboardPath } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw } from "lucide-react"

export const BatchDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

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
      <PageBreadcrumb
        items={[
          { label: "Dashboard", to: getDashboardPath() },
          { label: "Invoice upload", to: "/invoice-upload" },
          { label: "Batch details" },
        ]}
      />

      <PageHeader
        title={`Batch details: ${batch.file_name}`}
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
