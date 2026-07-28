import React from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  useDocumentUploadConfirm,
  useDocumentUploadSession,
} from "../hooks/useDocumentUpload"
import { ClassificationConfirmPanel } from "../components/ClassificationConfirmPanel"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DOCUMENT_FILE_STATUS_VARIANT,
  DOCUMENT_SESSION_STATUS_VARIANT,
  getStatusVariant,
} from "@/lib/design-tokens"
import { useToast } from "@/components/ui/toast"
import { ExternalLink, RefreshCw, FileText, CreditCard, ClipboardList, Package } from "lucide-react"
import type { ConfirmableType, DocumentUploadFile } from "../types"
import { formatDocumentType } from "../types"
import { SessionInvoiceBatchReview } from "../components/SessionInvoiceDuplicateReview"

function isConfirmableType(type: string | null | undefined): type is ConfirmableType {
  return (
    type === "INVOICE" ||
    type === "PAYMENT" ||
    type === "PURCHASE_ORDER" ||
    type === "GRN"
  )
}

function getTypeIcon(type: string | null | undefined) {
  if (type === "PAYMENT") {
    return <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
  }
  if (type === "PURCHASE_ORDER") {
    return <ClipboardList className="h-4 w-4 shrink-0 text-muted-foreground" />
  }
  if (type === "GRN") {
    return <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
  }
  return <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
}

function formatLabel(value: string | null | undefined): string {
  if (!value) return "—"
  return value.replace(/_/g, " ")
}

function getDestinationLink(
  file: DocumentUploadFile,
  sessionId: string
): { label: string; to: string } | null {
  if (file.status !== "ROUTED" || !file.target_id) return null
  const returnQuery = `?fromSession=${encodeURIComponent(sessionId)}`
  if (file.target_type === "INVOICE_BATCH") {
    return {
      label: "View invoice batch",
      to: `/invoice-upload/batches/${file.target_id}${returnQuery}`,
    }
  }
  if (file.target_type === "PAYMENT_UPLOAD") {
    return {
      label: "View payment upload",
      to: `/payment-upload/${file.target_id}${returnQuery}`,
    }
  }
  if (file.target_type === "PO_BATCH") {
    return {
      label: "View PO batch",
      to: `/po-upload/batches/${file.target_id}${returnQuery}`,
    }
  }
  if (file.target_type === "GRN_BATCH") {
    return {
      label: "View GRN batch",
      to: `/grn-upload/batches/${file.target_id}${returnQuery}`,
    }
  }
  return null
}

function buildInitialSelections(files: DocumentUploadFile[]): Record<string, ConfirmableType> {
  const selections: Record<string, ConfirmableType> = {}
  for (const file of files) {
    if (file.status === "PENDING_CONFIRMATION") {
      selections[file.id] = isConfirmableType(file.predicted_type)
        ? file.predicted_type
        : "INVOICE"
    }
  }
  return selections
}

function getInvoiceBatchIds(files: DocumentUploadFile[]): string[] {
  const ids = new Set<string>()
  for (const file of files) {
    if (file.target_type === "INVOICE_BATCH" && file.target_id) {
      ids.add(file.target_id)
    }
  }
  return Array.from(ids)
}

export const UnifiedUploadHubPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [selections, setSelections] = React.useState<Record<string, ConfirmableType>>({})

  const { data: session, isLoading, error, refetch } = useDocumentUploadSession(id)

  const confirmMutation = useDocumentUploadConfirm(id)

  React.useEffect(() => {
    if (session?.files) {
      setSelections(buildInitialSelections(session.files))
    }
  }, [session?.files])

  const handleConfirm = async () => {
    if (!id || !session) return
    const pendingSelections: Record<string, ConfirmableType> = {}
    for (const file of session.files) {
      if (file.status === "PENDING_CONFIRMATION") {
        pendingSelections[file.id] = selections[file.id] ?? "INVOICE"
      }
    }

    try {
      await confirmMutation.mutateAsync({ confirmations: Object.entries(pendingSelections).map(([file_id, document_type]) => ({ file_id, document_type })) })
      toast({
        title: "Documents routed",
        description: "Processing has started.",
        type: "success",
      })
      void refetch()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast({
        title: "Routing failed",
        description: axiosErr.response?.data?.detail || "Could not process documents.",
        type: "error",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-md py-12">
        <EmptyState
          title="Session not found"
          description="The upload session could not be loaded."
          action={
            <Button variant="primary" size="sm" onClick={() => navigate("/upload")}>
              Back to upload
            </Button>
          }
        />
      </div>
    )
  }

  const awaitingConfirmation = session.status === "AWAITING_CONFIRMATION"
  const invoiceBatchIds = getInvoiceBatchIds(session.files)

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Upload documents", to: "/upload" },
          { label: "Session" },
        ]}
      />

      <PageHeader
        title="Upload session"
        description={session.source_file_name}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="icon"
              size="sm"
              onClick={() => void refetch()}
              title="Refresh status"
              aria-label="Refresh status"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Badge
              variant={getStatusVariant(DOCUMENT_SESSION_STATUS_VARIANT, session.status)}
              shape="pill"
            >
              {formatLabel(session.status)}
            </Badge>
          </div>
        }
      />

      {awaitingConfirmation ? (
        <ClassificationConfirmPanel
          files={session.files}
          selections={selections}
          onSelectionChange={(fileId, type) =>
            setSelections((prev) => ({ ...prev, [fileId]: type }))
          }
          onConfirm={() => void handleConfirm()}
          isConfirming={confirmMutation.isPending}
        />
      ) : (
        <>
          {invoiceBatchIds.length > 0 && (
            <div className="space-y-6">
              {invoiceBatchIds.map((batchId) => (
                <SessionInvoiceBatchReview key={batchId} batchId={batchId} />
              ))}
            </div>
          )}

          <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-semibold">Documents in this session</CardTitle>
            <CardDescription>
              Each file was classified and routed to the invoice, purchase order, GRN, or payment
              pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Detected</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Destination</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.files.map((file) => {
                  const destination = id ? getDestinationLink(file, id) : null
                  const detectedType = file.confirmed_type || file.predicted_type

                  return (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(detectedType)}
                          <span className="truncate font-medium">{file.file_name}</span>
                        </div>
                        {file.error_message && (
                          <p className="mt-1 text-xs text-destructive">{file.error_message}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          {formatDocumentType(detectedType)}
                          {file.confidence != null ? ` (${Math.round(file.confidence)}%)` : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusVariant(DOCUMENT_FILE_STATUS_VARIANT, file.status)}
                          shape="pill"
                        >
                          {formatLabel(file.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {destination ? (
                          <Link
                            to={destination.to}
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            {destination.label}
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {session.status === "ROUTING" ? "Routing…" : "—"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </>
      )}
    </div>
  )
}

export default UnifiedUploadHubPage
