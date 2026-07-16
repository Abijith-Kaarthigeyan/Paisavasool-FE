import React from "react"
import { FileText, CreditCard, ClipboardList, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ConfirmableType, DocumentUploadFile } from "../types"
import { formatDocumentType } from "../types"

interface ClassificationConfirmPanelProps {
  files: DocumentUploadFile[]
  selections: Record<string, ConfirmableType>
  onSelectionChange: (fileId: string, type: ConfirmableType) => void
  onConfirm: () => void
  isConfirming: boolean
}

const CONFIRMABLE_TYPES: ConfirmableType[] = ["INVOICE", "PAYMENT", "PURCHASE_ORDER"]

function isConfirmableType(type: string | null | undefined): type is ConfirmableType {
  return type === "INVOICE" || type === "PAYMENT" || type === "PURCHASE_ORDER"
}

function getTypeIcon(type: string | null | undefined) {
  if (type === "PAYMENT") {
    return <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
  }
  if (type === "PURCHASE_ORDER") {
    return <ClipboardList className="h-4 w-4 shrink-0 text-muted-foreground" />
  }
  return <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
}

function getDefaultSuggestion(file: DocumentUploadFile): ConfirmableType {
  if (isConfirmableType(file.predicted_type)) {
    return file.predicted_type
  }
  return "INVOICE"
}

export const ClassificationConfirmPanel: React.FC<ClassificationConfirmPanelProps> = ({
  files,
  selections,
  onSelectionChange,
  onConfirm,
  isConfirming,
}) => {
  const pendingFiles = files.filter((f) => f.status === "PENDING_CONFIRMATION")
  const readyFiles = files.filter((f) => f.status === "READY")

  const allPendingResolved = pendingFiles.every((f) =>
    CONFIRMABLE_TYPES.includes(selections[f.id])
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-semibold">Classification results</CardTitle>
          <CardDescription>
            The agent analyzed your documents. Confirm any low-confidence items before processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {readyFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Auto-classified
              </p>
              {readyFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {getTypeIcon(file.confirmed_type)}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {file.file_name}
                      </p>
                      {file.reasoning && file.reasoning.length > 0 && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {file.reasoning[0]}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="success" shape="pill">
                    {formatDocumentType(file.confirmed_type)}
                    {file.confidence != null ? ` (${Math.round(file.confidence)}%)` : ""}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-warning">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                Needs your confirmation
              </p>
              {pendingFiles.map((file) => {
                const selected = selections[file.id]
                const suggested = getDefaultSuggestion(file)

                return (
                  <div
                    key={file.id}
                    className="rounded-md border border-warning/30 bg-warning-muted/30 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {file.file_name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Suggested: {formatDocumentType(file.predicted_type)}
                          {file.confidence != null
                            ? ` (${Math.round(file.confidence)}% confidence)`
                            : ""}
                        </p>
                        {file.reasoning && file.reasoning.length > 0 && (
                          <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                            {file.reasoning.slice(0, 3).map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={selected === "INVOICE" ? "primary" : "secondary"}
                          onClick={() => onSelectionChange(file.id, "INVOICE")}
                          className={cn(
                            "gap-1.5",
                            selected === "INVOICE" && "ring-2 ring-primary/30"
                          )}
                        >
                          <FileText className="h-3.5 w-3.5" aria-hidden />
                          Invoice
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={selected === "PURCHASE_ORDER" ? "primary" : "secondary"}
                          onClick={() => onSelectionChange(file.id, "PURCHASE_ORDER")}
                          className={cn(
                            "gap-1.5",
                            selected === "PURCHASE_ORDER" && "ring-2 ring-primary/30"
                          )}
                        >
                          <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                          Purchase order
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={selected === "PAYMENT" ? "primary" : "secondary"}
                          onClick={() => onSelectionChange(file.id, "PAYMENT")}
                          className={cn(
                            "gap-1.5",
                            selected === "PAYMENT" && "ring-2 ring-primary/30"
                          )}
                        >
                          <CreditCard className="h-3.5 w-3.5" aria-hidden />
                          Payment
                        </Button>
                      </div>
                    </div>
                    {!selected && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Default suggestion: {formatDocumentType(suggested)} — pick a type to
                        continue.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={onConfirm}
          disabled={isConfirming || (pendingFiles.length > 0 && !allPendingResolved)}
        >
          {isConfirming ? "Processing…" : "Process documents"}
        </Button>
      </div>
    </div>
  )
}

export default ClassificationConfirmPanel
