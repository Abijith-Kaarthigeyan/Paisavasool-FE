import React from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  useBatchStatus,
  useBatchReviewItems,
} from "../hooks/useInvoices"
import { DuplicateInvoiceReviewPanel } from "../components/DuplicateInvoiceReviewPanel"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card"
import { AiAgentCard } from "@/components/ui/ai-agent-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BATCH_STATUS_VARIANT,
  getStatusVariant,
} from "@/lib/design-tokens"
import {
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react"
import type { InvoiceUploadFile, ReviewQueueItem } from "../types"

type ParsedFileMeta = {
  reason: string
  rawText: string
  reviewItemId: string | null
}

export const BatchDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [expandedFiles, setExpandedFiles] = React.useState<Record<string, boolean>>({})

  const toggleExpand = (fileId: string) => {
    setExpandedFiles((prev) => ({ ...prev, [fileId]: !prev[fileId] }))
  }

  const { data: batch, isLoading: isBatchLoading, error: batchError } = useBatchStatus(id)
  const { data: reviewItems } = useBatchReviewItems(id)

  const parseErrorMessage = (errorMsg: string | null): ParsedFileMeta => {
    if (!errorMsg) return { reason: "Unknown error occurred.", rawText: "", reviewItemId: null }
    try {
      if (errorMsg.trim().startsWith("{")) {
        const parsed = JSON.parse(errorMsg)
        return {
          reason: parsed.reason || "Extraction failed.",
          rawText: parsed.raw_text || "",
          reviewItemId: parsed.review_item_id || null,
        }
      }
    } catch {
      // Fallback if it's not JSON
    }
    return { reason: errorMsg, rawText: "", reviewItemId: null }
  }

  const pendingReviewFiles = React.useMemo(() => {
    if (!batch?.files) return []
    return batch.files.filter((f) => f.status === "PENDING_REVIEW")
  }, [batch])

  const failedFiles = React.useMemo(() => {
    if (!batch?.files) return []
    return batch.files.filter((f) => f.status === "FAILED")
  }, [batch])

  const pendingDuplicateReviews = React.useMemo(() => {
    const items = reviewItems || []
    return items.filter(
      (item: ReviewQueueItem) =>
        item.review_reason === "DUPLICATE_INVOICE" && item.status === "PENDING"
    )
  }, [reviewItems])

  const fileNameByReviewId = React.useMemo(() => {
    const map = new Map<string, string>()
    if (!batch?.files) return map
    for (const file of batch.files) {
      const { reviewItemId } = parseErrorMessage(file.error_message)
      if (reviewItemId) {
        map.set(reviewItemId, file.file_name)
      }
    }
    for (const item of pendingDuplicateReviews) {
      if (item.batch_file_id) {
        const file = batch?.files?.find((f) => f.id === item.batch_file_id)
        if (file) map.set(item.id, file.file_name)
      }
    }
    return map
  }, [batch, pendingDuplicateReviews])

  const formatStatus = (status: string | undefined) => {
    if (!status) return ""
    return status.replace(/_/g, " ")
  }

  const isProcessing = batch?.status === "UPLOADED" || batch?.status === "PROCESSING"
  const processedPercent =
    batch && batch.total_files > 0
      ? Math.round((batch.processed_files / batch.total_files) * 100)
      : 0

  if (isBatchLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (batchError || !batch) {
    return (
      <div className="mx-auto max-w-md py-12">
        <EmptyState
          icon={<XCircle className="h-6 w-6 text-destructive" />}
          title="Failed to load batch"
          description="The batch details could not be found. It may be deleted or does not exist."
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate("/invoice-upload")}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Back to upload center
            </Button>
          }
        />
      </div>
    )
  }

  const pendingReviewCount = batch.pending_review_count ?? pendingReviewFiles.length

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Batch ingestion details"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/invoice-upload")}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Back
            </Button>
            <Badge
              variant={getStatusVariant(BATCH_STATUS_VARIANT, batch.status)}
              shape="pill"
            >
              {formatStatus(batch.status)}
            </Badge>
          </div>
        }
      />

      <KpiGrid columns={5}>
        <KpiCard
          label="Total invoices"
          value={batch.total_files}
          icon={<Layers className="h-5 w-5" />}
        />
        <KpiCard
          label="Successful ingestion"
          value={batch.success_count}
          icon={<CheckCircle className="h-5 w-5" />}
          iconTone="success"
        />
        <KpiCard
          label="Pending duplicate review"
          value={pendingReviewCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconTone="warning"
        />
        <KpiCard
          label="Failed ingestion"
          value={batch.failed_count}
          icon={<XCircle className="h-5 w-5" />}
          iconTone="destructive"
        />
        <KpiCard
          label="Uploaded at"
          value={
            <span className="text-sm font-medium">
              {new Date(batch.uploaded_at).toLocaleString(undefined, {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
          }
          icon={<Calendar className="h-5 w-5" />}
          iconTone="info"
        />
      </KpiGrid>

      {isProcessing && (
        <AiAgentCard
          agentName="Invoice extraction agent"
          stage={`Processing file ${batch.processed_files} of ${batch.total_files}`}
          stageLabel="Extraction stage"
          progress={processedPercent}
          status="running"
        />
      )}

      {pendingDuplicateReviews.length > 0 && id && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Duplicate invoices pending review
            </h2>
            <p className="text-sm text-muted-foreground">
              Compare the upload with the latest version, then approve, edit, or reject.
            </p>
          </div>
          {pendingDuplicateReviews.map((item) => (
            <DuplicateInvoiceReviewPanel
              key={item.id}
              item={item}
              batchId={id}
              fileName={fileNameByReviewId.get(item.id)}
            />
          ))}
        </section>
      )}

      {pendingReviewFiles.length > 0 && pendingDuplicateReviews.length === 0 && (
        <Card className="border-warning/20">
          <CardContent className="flex items-center gap-3 p-4">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-warning" aria-hidden />
            <p className="text-sm text-foreground">
              {pendingReviewFiles.length} duplicate upload(s) are being prepared for review…
            </p>
          </CardContent>
        </Card>
      )}

      {failedFiles.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-destructive">
              <XCircle className="h-4 w-4" aria-hidden />
              Failed ingestion details
            </CardTitle>
            <CardDescription>
              Files that could not be processed during ingestion.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File name</TableHead>
                  <TableHead>Failure reason</TableHead>
                  <TableHead>Raw parsed text</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedFiles.map((file: InvoiceUploadFile) => {
                  const { reason, rawText } = parseErrorMessage(file.error_message)
                  const isExpanded = !!expandedFiles[file.id]
                  return (
                    <React.Fragment key={file.id}>
                      <TableRow>
                        <TableCell
                          className="max-w-[240px] truncate font-medium"
                          title={file.file_name}
                        >
                          {file.file_name}
                        </TableCell>
                        <TableCell className="text-destructive">{formatStatus(reason)}</TableCell>
                        <TableCell>
                          {rawText ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-primary"
                              onClick={() => toggleExpand(file.id)}
                            >
                              {isExpanded ? (
                                <>
                                  Hide raw text <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                                </>
                              ) : (
                                <>
                                  Show raw text ({rawText.length} chars){" "}
                                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs italic text-muted-foreground">
                              No raw text available
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && rawText && (
                        <TableRow>
                          <TableCell colSpan={3} className="bg-muted/30 p-4">
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-muted-foreground">
                                Raw extracted content
                              </span>
                              <pre className="max-h-60 overflow-y-auto rounded-md border border-border bg-background p-3 text-xs leading-relaxed whitespace-pre-wrap">
                                {rawText}
                              </pre>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!isProcessing &&
        failedFiles.length === 0 &&
        pendingDuplicateReviews.length === 0 &&
        batch.status === "COMPLETED" && (
          <Card className="border-success/20 bg-success-muted/30">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-5 w-5 shrink-0 text-success" aria-hidden />
              <p className="text-sm text-foreground">
                All {batch.total_files} invoice(s) were successfully parsed and registered.
              </p>
            </CardContent>
          </Card>
        )}

      {!isProcessing && batch.status === "PARTIAL_SUCCESS" && pendingDuplicateReviews.length === 0 && (
        <Card className="border-warning/20 bg-warning-muted/30">
          <CardContent className="flex items-center gap-3 p-4">
            <Loader2 className="h-5 w-5 shrink-0 text-warning" aria-hidden />
            <p className="text-sm text-foreground">
              {batch.success_count} succeeded and {batch.failed_count} failed.
              {pendingReviewCount > 0
                ? ` ${pendingReviewCount} duplicate(s) were resolved or are no longer pending.`
                : ""}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default BatchDetailsPage
