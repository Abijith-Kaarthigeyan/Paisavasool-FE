import React from "react"
import { useNavigate } from "react-router-dom"
import {
  useDocumentUploadIngest,
} from "../hooks/useDocumentUpload"
import { documentUploadService } from "../services/documentUploadService"
import { UnifiedUploadDropzone } from "../components/UnifiedUploadDropzone"
import { ClassificationConfirmPanel } from "../components/ClassificationConfirmPanel"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { getDashboardPath } from "@/lib/navigation"
import { useToast } from "@/components/ui/toast"
import type { ConfirmableType, DocumentUploadFile, DocumentUploadSession } from "../types"

function isConfirmableType(type: string | null | undefined): type is ConfirmableType {
  return type === "INVOICE" || type === "PAYMENT" || type === "PURCHASE_ORDER"
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

function tryShortcutNavigate(
  navigate: ReturnType<typeof useNavigate>,
  session: DocumentUploadSession
): boolean {
  if (session.files.length !== 1) return false
  const file = session.files[0]
  if (file.status !== "ROUTED" || !file.target_id) return false

  if (file.target_type === "INVOICE_BATCH") {
    navigate(`/invoice-upload/batches/${file.target_id}`)
    return true
  }
  if (file.target_type === "PAYMENT_UPLOAD") {
    navigate(`/payment-upload/${file.target_id}`)
    return true
  }
  if (file.target_type === "PO_BATCH") {
    navigate(`/po-upload/batches/${file.target_id}`)
    return true
  }
  return false
}

export const UnifiedUploadPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [files, setFiles] = React.useState<DocumentUploadFile[]>([])
  const [selections, setSelections] = React.useState<Record<string, ConfirmableType>>({})
  const [showReview, setShowReview] = React.useState(false)
  const [isRouting, setIsRouting] = React.useState(false)

  const ingestMutation = useDocumentUploadIngest()

  const handleAfterRoute = (session: DocumentUploadSession) => {
    if (tryShortcutNavigate(navigate, session)) return
    navigate(`/upload/sessions/${session.id}`)
  }

  const routeSession = async (
    targetSessionId: string,
    pendingSelections: Record<string, ConfirmableType>
  ) => {
    setIsRouting(true)
    try {
      const confirmations = Object.entries(pendingSelections).map(
        ([file_id, document_type]) => ({ file_id, document_type })
      )
      const session = await documentUploadService.confirm(targetSessionId, {
        confirmations,
      })
      handleAfterRoute(session)
      return session
    } finally {
      setIsRouting(false)
    }
  }

  const handleFileSelect = async (file: File) => {
    try {
      const result = await ingestMutation.mutateAsync(file)
      setSessionId(result.session_id)
      setFiles(result.files)

      if (!result.requires_confirmation) {
        await routeSession(result.session_id, {})
        toast({
          title: "Upload classified",
          description: "All documents recognized — processing started.",
          type: "success",
        })
        return
      }

      setSelections(buildInitialSelections(result.files))
      setShowReview(true)
      toast({
        title: "Classification complete",
        description: "Review items that need confirmation before processing.",
        type: "success",
      })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast({
        title: "Upload failed",
        description: axiosErr.response?.data?.detail || "Could not analyze document.",
        type: "error",
      })
    }
  }

  const handleSelectionChange = (fileId: string, type: ConfirmableType) => {
    setSelections((prev) => ({ ...prev, [fileId]: type }))
  }

  const handleProcessDocuments = async () => {
    if (!sessionId) return
    const pendingSelections: Record<string, ConfirmableType> = {}
    for (const file of files) {
      if (file.status === "PENDING_CONFIRMATION") {
        pendingSelections[file.id] = selections[file.id] ?? "INVOICE"
      }
    }

    try {
      await routeSession(sessionId, pendingSelections)
      toast({
        title: "Documents routed",
        description: "Processing has started in the invoice, purchase order, and payment pipelines.",
        type: "success",
      })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      toast({
        title: "Routing failed",
        description: axiosErr.response?.data?.detail || "Could not process documents.",
        type: "error",
      })
    }
  }

  const isBusy = ingestMutation.isPending || isRouting

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", to: getDashboardPath() },
          { label: "Upload documents" },
        ]}
      />

      <PageHeader
        title="Upload documents"
        description="Upload invoices, purchase orders, or payment proofs — the agent will classify each document automatically."
      />

      {!showReview ? (
        <UnifiedUploadDropzone
          onFileSelect={handleFileSelect}
          isUploading={isBusy}
          uploadLabel={isRouting ? "Routing documents…" : "Analyzing documents…"}
        />
      ) : (
        <ClassificationConfirmPanel
          files={files}
          selections={selections}
          onSelectionChange={handleSelectionChange}
          onConfirm={() => void handleProcessDocuments()}
          isConfirming={isRouting}
        />
      )}
    </div>
  )
}

export default UnifiedUploadPage
