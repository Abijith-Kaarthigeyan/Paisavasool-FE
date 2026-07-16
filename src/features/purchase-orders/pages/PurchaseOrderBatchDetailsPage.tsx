import React from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  useBatchPurchaseOrders,
  usePoBatchStatus,
} from "../hooks/usePurchaseOrders"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card"
import { AiAgentCard } from "@/components/ui/ai-agent-card"
import { PurchaseOrderStatusBadge } from "../components/PurchaseOrderStatusBadge"
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
  INVOICE_FILE_STATUS_VARIANT,
  getStatusVariant,
} from "@/lib/design-tokens"
import { formatCurrency } from "@/lib/formatCurrency"
import {
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Layers,
  ChevronLeft,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"
import type { PoUploadFile } from "../types"

type ParsedFileMeta = {
  reason: string
  rawText: string
  reviewItemId: string | null
  existingPoId: string | null
}

function parseErrorMessage(errorMsg: string | null): ParsedFileMeta {
  if (!errorMsg) {
    return { reason: "Unknown error occurred.", rawText: "", reviewItemId: null, existingPoId: null }
  }
  try {
    if (errorMsg.trim().startsWith("{")) {
      const parsed = JSON.parse(errorMsg)
      return {
        reason: parsed.reason || "Extraction failed.",
        rawText: parsed.raw_text || "",
        reviewItemId: parsed.review_item_id || null,
        existingPoId: parsed.existing_po_id || null,
      }
    }
  } catch {
    // Fallback if it's not JSON
  }
  return { reason: errorMsg, rawText: "", reviewItemId: null, existingPoId: null }
}

function formatStatus(status: string | undefined) {
  if (!status) return ""
  return status.replace(/_/g, " ")
}

function formatDuplicateReason(reason: string) {
  if (reason === "DUPLICATE_PO") {
    return "Duplicate PO — manual review required"
  }
  return formatStatus(reason)
}

export const PurchaseOrderBatchDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromSessionId = searchParams.get("fromSession")

  const { data: batch, isLoading: isBatchLoading, error: batchError } = usePoBatchStatus(id)

  const isProcessing = batch?.status === "UPLOADED" || batch?.status === "PROCESSING"
  const batchComplete =
    batch?.status === "COMPLETED" ||
    batch?.status === "PARTIAL_SUCCESS" ||
    batch?.status === "FAILED"

  const { data: purchaseOrders, isLoading: isPosLoading } = useBatchPurchaseOrders(
    id,
    !!batchComplete && !isProcessing
  )

  const pendingReviewFiles = React.useMemo(() => {
    if (!batch?.files) return []
    return batch.files.filter((f) => f.status === "PENDING_REVIEW")
  }, [batch])

  const failedFiles = React.useMemo(() => {
    if (!batch?.files) return []
    return batch.files.filter((f) => f.status === "FAILED")
  }, [batch])

  const processedPercent =
    batch && batch.total_files > 0
      ? Math.round((batch.processed_files / batch.total_files) * 100)
      : 0

  if (isBatchLoading) {
    return (
      <div className="space-y-6">
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
            <Button variant="ghost" size="sm" onClick={() => navigate("/upload")}>
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
    <div className="space-y-8">
      <PageBreadcrumb
        items={
          fromSessionId
            ? [
                { label: "Upload documents", to: "/upload" },
                { label: "Session", to: `/upload/sessions/${fromSessionId}` },
                { label: "PO batch details" },
              ]
            : [
                { label: "Upload documents", to: "/upload" },
                { label: "PO batch details" },
              ]
        }
      />

      <PageHeader
        title={batch.file_name}
        description="Purchase order batch ingestion"
        actions={
          <div className="flex items-center gap-2">
            {fromSessionId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/upload/sessions/${fromSessionId}`)}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Back to session
              </Button>
            )}
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
          label="Total files"
          value={batch.total_files}
          icon={<Layers className="h-5 w-5" />}
        />
        <KpiCard
          label="Successful"
          value={batch.success_count}
          icon={<CheckCircle className="h-5 w-5" />}
          iconTone="success"
        />
        <KpiCard
          label="Needs review"
          value={pendingReviewCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconTone="warning"
        />
        <KpiCard
          label="Failed"
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
          agentName="PO extraction agent"
          stage={`Processing file ${batch.processed_files} of ${batch.total_files}`}
          stageLabel="Extraction stage"
          progress={processedPercent}
          status="running"
        />
      )}

      {pendingReviewFiles.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Needs review</h2>
            <p className="text-sm text-muted-foreground">
              Duplicate purchase orders require manual review. Resolve outside the app or contact
              an admin — in-app approve/reject is not available for PO duplicates yet.
            </p>
          </div>
          <Card className="border-warning/20">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File name</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Existing PO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReviewFiles.map((file: PoUploadFile) => {
                    const { reason, existingPoId } = parseErrorMessage(file.error_message)
                    return (
                      <TableRow key={file.id}>
                        <TableCell
                          className="max-w-[240px] truncate font-medium"
                          title={file.file_name}
                        >
                          {file.file_name}
                        </TableCell>
                        <TableCell className="text-warning">
                          {formatDuplicateReason(reason)}
                        </TableCell>
                        <TableCell className="text-right">
                          {existingPoId ? (
                            <Link
                              to={`/purchase-orders/${existingPoId}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                            >
                              View PO
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}

      {batch.files && batch.files.length > 0 && (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-semibold">Files in this batch</CardTitle>
            <CardDescription>Status of each PDF processed in this upload.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.files.map((file: PoUploadFile) => (
                  <TableRow key={file.id}>
                    <TableCell
                      className="max-w-[280px] truncate font-medium"
                      title={file.file_name}
                    >
                      {file.file_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(INVOICE_FILE_STATUS_VARIANT, file.status)}
                        shape="pill"
                      >
                        {formatStatus(file.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {batchComplete && !isProcessing && (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-semibold">Imported purchase orders</CardTitle>
            <CardDescription>
              Purchase orders successfully created from this batch.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isPosLoading ? (
              <div className="p-6">
                <Skeleton className="h-24 w-full" />
              </div>
            ) : purchaseOrders && purchaseOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>PO date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.customer?.customer_name ?? "—"}</TableCell>
                      <TableCell>
                        {new Date(po.po_date).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </TableCell>
                      <TableCell>{formatCurrency(po.total_amount)}</TableCell>
                      <TableCell>
                        <PurchaseOrderStatusBadge status={po.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/purchase-orders/${po.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          View PO
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-sm text-muted-foreground">
                No purchase orders were imported from this batch.
              </div>
            )}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedFiles.map((file: PoUploadFile) => {
                  const { reason } = parseErrorMessage(file.error_message)
                  return (
                    <TableRow key={file.id}>
                      <TableCell
                        className="max-w-[240px] truncate font-medium"
                        title={file.file_name}
                      >
                        {file.file_name}
                      </TableCell>
                      <TableCell className="text-destructive">{formatStatus(reason)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!isProcessing &&
        failedFiles.length === 0 &&
        pendingReviewFiles.length === 0 &&
        batch.status === "COMPLETED" && (
          <Card className="border-success/20 bg-success-muted/30">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-5 w-5 shrink-0 text-success" aria-hidden />
              <p className="text-sm text-foreground">
                All {batch.total_files} file(s) were successfully processed.
              </p>
            </CardContent>
          </Card>
        )}

      {!isProcessing && batch.status === "PARTIAL_SUCCESS" && pendingReviewFiles.length === 0 && (
        <Card className="border-warning/20 bg-warning-muted/30">
          <CardContent className="flex items-center gap-3 p-4">
            <Loader2 className="h-5 w-5 shrink-0 text-warning" aria-hidden />
            <p className="text-sm text-foreground">
              {batch.success_count} succeeded and {batch.failed_count} failed.
              {pendingReviewCount > 0
                ? ` ${pendingReviewCount} duplicate(s) are pending review.`
                : ""}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PurchaseOrderBatchDetailsPage
