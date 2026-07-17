export type DocumentType =
  | "INVOICE"
  | "PAYMENT"
  | "PURCHASE_ORDER"
  | "GRN"
  | "UNKNOWN"

export type ConfirmableType = "INVOICE" | "PAYMENT" | "PURCHASE_ORDER" | "GRN"

export type DocumentFileStatus =
  | "PENDING_CONFIRMATION"
  | "READY"
  | "ROUTED"
  | "FAILED"

export type DocumentSessionStatus =
  | "CLASSIFYING"
  | "AWAITING_CONFIRMATION"
  | "ROUTING"
  | "COMPLETED"
  | "FAILED"

export type DocumentTargetType =
  | "INVOICE_BATCH"
  | "PO_BATCH"
  | "PAYMENT_UPLOAD"
  | "GRN_BATCH"

export interface DocumentUploadFile {
  id: string
  file_name: string
  predicted_type: DocumentType | null
  confirmed_type: DocumentType | null
  confidence: number | null
  reasoning: string[] | null
  status: DocumentFileStatus
  target_type: DocumentTargetType | null
  target_id: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface DocumentUploadSession {
  id: string
  source_file_name: string
  uploaded_by: string
  status: DocumentSessionStatus
  files: DocumentUploadFile[]
  created_at: string
  updated_at: string
}

export interface DocumentUploadIngestResponse {
  session_id: string
  status: DocumentSessionStatus
  files: DocumentUploadFile[]
  requires_confirmation: boolean
}

export interface DocumentUploadFileConfirmation {
  file_id: string
  document_type: ConfirmableType
}

export function formatDocumentType(type: string | null | undefined): string {
  if (!type || type === "UNKNOWN") return "Unknown"
  if (type === "GRN") return "Goods receipt note"
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ")
}

export interface DocumentUploadConfirmRequest {
  confirmations: DocumentUploadFileConfirmation[]
}
