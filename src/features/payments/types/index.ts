export type PaymentUploadStatus = 
  | "UPLOADED" 
  | "PROCESSING" 
  | "MATCHED" 
  | "REVIEW_REQUIRED" 
  | "FAILED";

export interface PaymentUploadResponse {
  id: string;
  file_name: string;
  status: PaymentUploadStatus;
  uploaded_by: string;
  uploaded_at: string;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  error_message: string | null;
  raw_text?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentUploadCreateResponse {
  upload_id: string;
  status: string;
  message: string;
}

export interface PaymentUploadStatusResponse {
  upload_id: string;
  status: PaymentUploadStatus;
  error_message: string | null;
}
