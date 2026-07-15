export type PaymentUploadStatus = 
  | "UPLOADED" 
  | "PROCESSING" 
  | "MATCHED" 
  | "REVIEW_REQUIRED" 
  | "FAILED";

export interface MatchAllocation {
  invoice_id: string;
  invoice_number: string;
  allocated_amount: number;
  match_type: string;
  confidence_score: number;
}

export interface PaymentMatchResult {
  payment_id: string;
  customer_name: string;
  payment_reference: string | null;
  payment_amount: number;
  payment_date: string;
  currency: string;
  payment_status: string;
  allocated_amount: number;
  credit_amount: number | null;
  allocations: MatchAllocation[];
}

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
  match_result?: PaymentMatchResult | null;
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
