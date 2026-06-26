export type DocumentType = "INVOICE" | "PAYMENT" | "UNKNOWN"

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

export type DocumentTargetType = "INVOICE_BATCH" | "PAYMENT_UPLOAD"

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
  document_type: "INVOICE" | "PAYMENT"
}

export interface DocumentUploadConfirmRequest {
  confirmations: DocumentUploadFileConfirmation[]
}
