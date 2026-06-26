import React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { usePaymentUpload, usePaymentUploadStatus } from "../hooks/usePayments"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { AiAgentCard } from "@/components/ui/ai-agent-card"
import { PAYMENT_STATUS_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"
import {
  FileText,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Upload,
  ScanSearch,
  GitMerge,
} from "lucide-react"

const PIPELINE_STEPS = [
  { key: "ingest", label: "Ingest", icon: Upload },
  { key: "extract", label: "Extract & validate", icon: ScanSearch },
  { key: "match", label: "Match", icon: GitMerge },
] as const

function getStepState(
  stepKey: (typeof PIPELINE_STEPS)[number]["key"],
  status: string
): "complete" | "active" | "pending" | "error" | "warning" {
  if (status === "FAILED") {
    if (stepKey === "ingest" || stepKey === "extract") return "complete"
    if (stepKey === "match") return "error"
    return "pending"
  }

  if (status === "MATCHED") return "complete"

  if (status === "REVIEW_REQUIRED") {
    if (stepKey === "match") return "warning"
    return "complete"
  }

  if (status === "PROCESSING") {
    if (stepKey === "ingest") return "complete"
    if (stepKey === "extract") return "active"
    return "pending"
  }

  // UPLOADED
  if (stepKey === "ingest") return "active"
  return "pending"
}

function getAgentStage(status: string): { stage: string; agentStatus: "running" | "complete" | "error" | "idle"; progress?: number } {
  switch (status) {
    case "UPLOADED":
      return { stage: "Document ingested — awaiting OCR extraction", agentStatus: "running", progress: 33 }
    case "PROCESSING":
      return { stage: "AI extraction and metadata validation in progress", agentStatus: "running", progress: 66 }
    case "MATCHED":
      return { stage: "Payment matched and auto-approved", agentStatus: "complete", progress: 100 }
    case "REVIEW_REQUIRED":
      return {
        stage: "Match confidence below threshold — routed to human review",
        agentStatus: "complete",
        progress: 100,
      }
    case "FAILED":
      return { stage: "Matching pipeline failed", agentStatus: "error" }
    default:
      return { stage: "Awaiting processing", agentStatus: "idle" }
  }
}

export const PaymentUploadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: upload, isLoading: isUploadLoading, error: uploadError, refetch } = usePaymentUpload(id)
  const { data: statusData } = usePaymentUploadStatus(id)

  const activeStatus = statusData?.status || upload?.status || "UPLOADED"
  const errorMessage = statusData?.error_message || upload?.error_message || null
  const agentInfo = getAgentStage(activeStatus)

  if (isUploadLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    )
  }

  if (uploadError || !upload) {
    return (
      <div className="mx-auto max-w-md py-12">
        <EmptyState
          title="Payment record not found"
          description="The requested payment upload details could not be loaded."
          action={
            <Button variant="primary" size="sm" onClick={() => navigate("/payment-upload-history")}>
              Back to history
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageBreadcrumb
        items={[
          { label: "Payment history", to: "/payment-upload-history" },
          { label: "Upload details" },
        ]}
      />

      <PageHeader
        title="Payment ingestion details"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="icon"
              size="sm"
              onClick={() => refetch()}
              title="Refresh status"
              aria-label="Refresh status"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Badge
              variant={getStatusVariant(PAYMENT_STATUS_VARIANT, activeStatus)}
              shape="pill"
            >
              {activeStatus.replace(/_/g, " ")}
            </Badge>
          </div>
        }
      />

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-semibold">Matching pipeline</CardTitle>
          <CardDescription>Payment matching agent progress through ingestion stages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {PIPELINE_STEPS.map((step, index) => {
              const state = getStepState(step.key, activeStatus)
              const Icon = step.icon
              return (
                <li key={step.key} className="flex flex-1 items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                      state === "complete" && "border-success/30 bg-success-muted text-success",
                      state === "active" && "border-primary/30 bg-primary/10 text-primary",
                      state === "warning" && "border-warning/30 bg-warning-muted text-warning",
                      state === "error" && "border-destructive/30 bg-destructive/10 text-destructive",
                      state === "pending" && "border-border bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-xs font-medium",
                        state === "active" || state === "warning"
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </p>
                  </div>
                  {index < PIPELINE_STEPS.length - 1 && (
                    <div className="hidden h-px flex-1 bg-border sm:block" aria-hidden />
                  )}
                </li>
              )
            })}
          </ol>

          {agentInfo.agentStatus !== "idle" && (
            <AiAgentCard
              agentName="Payment matching agent"
              stage={agentInfo.stage}
              stageLabel="Current stage"
              progress={agentInfo.progress}
              status={agentInfo.agentStatus}
            />
          )}
        </CardContent>
      </Card>

      {errorMessage && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
            <div>
              <h5 className="text-sm font-semibold text-foreground">
                Processing ambiguity / ingest failure
              </h5>
              <p className="mt-0.5 text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="h-fit">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Calendar className="h-4 w-4 text-primary" aria-hidden />
              Document details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 pt-4 text-sm">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">File name</span>
              <span className="mt-0.5 truncate font-medium text-foreground">{upload.file_name}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Uploaded at</span>
              <span className="mt-0.5 font-medium text-foreground">
                {new Date(upload.uploaded_at).toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Ingested by</span>
              <span className="mt-0.5 text-sm font-medium text-foreground">Finance Associate</span>
            </div>
            <div className="flex flex-col border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">Current match status</span>
              <div className="mt-1">
                <Badge
                  variant={getStatusVariant(PAYMENT_STATUS_VARIANT, activeStatus)}
                  shape="pill"
                >
                  {activeStatus.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[350px] md:col-span-2">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 text-primary" aria-hidden />
              Plain text extracted
            </CardTitle>
            <CardDescription>
              Plain text extracted from PDF receipt by internal OCR service.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {upload.raw_text ? (
              <pre className="max-h-[400px] overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground">
                {upload.raw_text}
              </pre>
            ) : (
              <EmptyState
                title="OCR in progress"
                description="Text extraction is in progress or the document contained no readable text."
                className="py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PaymentUploadDetailPage
