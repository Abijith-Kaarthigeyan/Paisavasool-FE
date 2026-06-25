import React from "react"
import { InvoiceUploadBatch } from "../types/invoiceUpload.types"
import { Calendar, FileCheck2, ShieldAlert, Check, Upload, ScanSearch, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card"
import { AiAgentCard } from "@/components/ui/ai-agent-card"
import { BATCH_STATUS_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"

interface BatchStatusCardProps {
  batch: InvoiceUploadBatch
}

const PIPELINE_STEPS = [
  { key: "upload", label: "Upload", icon: Upload },
  { key: "extract", label: "Extract", icon: ScanSearch },
  { key: "validate", label: "Validate", icon: ShieldCheck },
  { key: "complete", label: "Complete", icon: Check },
] as const

function getStepState(
  stepKey: (typeof PIPELINE_STEPS)[number]["key"],
  status: string
): "complete" | "active" | "pending" | "error" {
  if (status === "FAILED") {
    if (stepKey === "upload") return "complete"
    if (stepKey === "extract") return "error"
    return "pending"
  }

  if (status === "UPLOADED") {
    if (stepKey === "upload") return "complete"
    if (stepKey === "extract") return "active"
    return "pending"
  }

  if (status === "PROCESSING") {
    if (stepKey === "upload" || stepKey === "extract") return "complete"
    if (stepKey === "validate") return "active"
    return "pending"
  }

  if (status === "COMPLETED" || status === "PARTIAL_SUCCESS") {
    return "complete"
  }

  return "pending"
}

export const BatchStatusCard: React.FC<BatchStatusCardProps> = ({ batch }) => {
  const isProcessing = batch.status === "PROCESSING" || batch.status === "UPLOADED"
  const processedPercent =
    batch.total_files > 0
      ? Math.round((batch.processed_files / batch.total_files) * 100)
      : 0

  const agentStatus =
    batch.status === "FAILED"
      ? "error"
      : isProcessing
        ? "running"
        : "complete"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-base font-semibold">Batch status</CardTitle>
              <Badge
                variant={getStatusVariant(BATCH_STATUS_VARIANT, batch.status)}
                shape="pill"
              >
                {batch.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground md:text-right">
              <div className="flex items-center gap-1.5 md:justify-end">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                <span>Uploaded: {new Date(batch.uploaded_at).toLocaleString()}</span>
              </div>
              {batch.completed_at && (
                <div>Completed: {new Date(batch.completed_at).toLocaleString()}</div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {PIPELINE_STEPS.map((step, index) => {
              const state = getStepState(step.key, batch.status)
              const Icon = step.icon
              return (
                <li key={step.key} className="flex flex-1 items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                      state === "complete" && "border-success/30 bg-success-muted text-success",
                      state === "active" && "border-primary/30 bg-primary/10 text-primary",
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
                        state === "active" ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </p>
                  </div>
                  {index < PIPELINE_STEPS.length - 1 && (
                    <div
                      className="hidden h-px flex-1 bg-border sm:block"
                      aria-hidden
                    />
                  )}
                </li>
              )
            })}
          </ol>

          {isProcessing && (
            <AiAgentCard
              agentName="Invoice extraction agent"
              stage={`Processing file ${batch.processed_files} of ${batch.total_files}`}
              stageLabel="Current stage"
              progress={processedPercent}
              status="running"
            />
          )}

          {!isProcessing && agentStatus === "complete" && (
            <AiAgentCard
              agentName="Invoice extraction agent"
              stage="Ingestion pipeline finished"
              stageLabel="Final stage"
              status="complete"
            />
          )}

          {!isProcessing && agentStatus === "error" && (
            <AiAgentCard
              agentName="Invoice extraction agent"
              stage="Extraction failed for one or more files"
              stageLabel="Final stage"
              status="error"
            />
          )}
        </CardContent>
      </Card>

      <KpiGrid columns={4}>
        <KpiCard label="Total invoices" value={batch.total_files} />
        <KpiCard label="Processed" value={batch.processed_files} />
        <KpiCard
          label="Succeeded"
          value={batch.success_count}
          icon={<FileCheck2 className="h-5 w-5" />}
          iconTone="success"
        />
        <KpiCard
          label="Failed"
          value={batch.failed_count}
          icon={<ShieldAlert className="h-5 w-5" />}
          iconTone="destructive"
        />
      </KpiGrid>
    </div>
  )
}
