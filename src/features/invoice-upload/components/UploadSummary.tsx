import React from "react"
import { InvoiceUploadBatch } from "../types/invoiceUpload.types"
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface UploadSummaryProps {
  batch: InvoiceUploadBatch
}

const summaryStyles = {
  completed: {
    icon: CheckCircle2,
    border: "border-success/20",
    bg: "bg-success-muted/40",
    iconClass: "text-success",
  },
  partial: {
    icon: AlertTriangle,
    border: "border-warning/20",
    bg: "bg-warning-muted/40",
    iconClass: "text-warning",
  },
  failed: {
    icon: AlertCircle,
    border: "border-destructive/20",
    bg: "bg-destructive/10",
    iconClass: "text-destructive",
  },
} as const

export const UploadSummary: React.FC<UploadSummaryProps> = ({ batch }) => {
  if (batch.status === "PROCESSING" || batch.status === "UPLOADED") {
    return null
  }

  const config =
    batch.status === "COMPLETED"
      ? summaryStyles.completed
      : batch.status === "PARTIAL_SUCCESS"
        ? summaryStyles.partial
        : batch.status === "FAILED"
          ? summaryStyles.failed
          : null

  if (!config) return null

  const Icon = config.icon

  const title =
    batch.status === "COMPLETED"
      ? "Batch import completed successfully"
      : batch.status === "PARTIAL_SUCCESS"
        ? "Import partial success"
        : "Batch import failed"

  const description =
    batch.status === "COMPLETED"
      ? `All ${batch.total_files} invoice(s) were successfully parsed, resolved, and registered in the accounts receivable ledger.`
      : batch.status === "PARTIAL_SUCCESS"
        ? `${batch.success_count} succeeded and ${batch.failed_count} were sent to the review queue. Please verify the issues below.`
        : `All ${batch.total_files} file(s) failed validation or parsing. The entire batch has been routed to the manual review queue.`

  return (
    <Card className={cn("border", config.border, config.bg)}>
      <CardContent className="flex items-start gap-4 p-5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background",
            config.iconClass
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
