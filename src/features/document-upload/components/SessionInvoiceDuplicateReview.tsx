import React from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { DuplicateInvoiceReviewPanel } from "@/features/invoices/components/DuplicateInvoiceReviewPanel"
import {
  useBatchReviewItems,
  useBatchStatus,
} from "@/features/invoices/hooks/useInvoices"
import type { ReviewQueueItem } from "@/features/invoices/types"

interface SessionInvoiceBatchReviewProps {
  batchId: string
}

function parseReviewItemId(errorMessage: string | null): string | null {
  if (!errorMessage?.trim().startsWith("{")) return null
  try {
    const parsed = JSON.parse(errorMessage) as { review_item_id?: string }
    return parsed.review_item_id || null
  } catch {
    return null
  }
}

export const SessionInvoiceBatchReview: React.FC<SessionInvoiceBatchReviewProps> = ({
  batchId,
}) => {
  const { data: batch } = useBatchStatus(batchId)
  const { data: reviewItems } = useBatchReviewItems(batchId)

  const pendingDuplicateReviews = React.useMemo(() => {
    const items = reviewItems || []
    return items.filter(
      (item: ReviewQueueItem) =>
        item.review_reason === "DUPLICATE_INVOICE" && item.status === "PENDING"
    )
  }, [reviewItems])

  const pendingReviewFiles = React.useMemo(() => {
    if (!batch?.files) return []
    return batch.files.filter((f) => f.status === "PENDING_REVIEW")
  }, [batch])

  const fileNameByReviewId = React.useMemo(() => {
    const map = new Map<string, string>()
    if (!batch?.files) return map

    for (const file of batch.files) {
      const reviewItemId = parseReviewItemId(file.error_message)
      if (reviewItemId) {
        map.set(reviewItemId, file.file_name)
      }
    }

    for (const item of pendingDuplicateReviews) {
      if (item.batch_file_id) {
        const file = batch.files.find((f) => f.id === item.batch_file_id)
        if (file) map.set(item.id, file.file_name)
      }
    }

    return map
  }, [batch, pendingDuplicateReviews])

  if (!batch) return null

  const isProcessing =
    batch.status === "UPLOADED" || batch.status === "PROCESSING"

  if (isProcessing && pendingDuplicateReviews.length === 0) {
    return (
      <Card className="border-warning/20">
        <CardContent className="flex items-center gap-3 p-4">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-warning" aria-hidden />
          <p className="text-sm text-foreground">
            Invoice extraction is running — duplicate checks will appear here if needed.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (pendingDuplicateReviews.length === 0 && pendingReviewFiles.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Duplicate invoices pending review
        </h2>
        <p className="text-sm text-muted-foreground">
          Compare the upload with the existing invoice, then approve, edit, or reject.
        </p>
      </div>

      {pendingDuplicateReviews.length === 0 && pendingReviewFiles.length > 0 && (
        <Card className="border-warning/20">
          <CardContent className="flex items-center gap-3 p-4">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-warning" aria-hidden />
            <p className="text-sm text-foreground">
              {pendingReviewFiles.length} duplicate upload(s) are being prepared for review…
            </p>
          </CardContent>
        </Card>
      )}

      {pendingDuplicateReviews.map((item) => (
        <DuplicateInvoiceReviewPanel
          key={item.id}
          item={item}
          batchId={batchId}
          fileName={fileNameByReviewId.get(item.id)}
        />
      ))}
    </section>
  )
}
