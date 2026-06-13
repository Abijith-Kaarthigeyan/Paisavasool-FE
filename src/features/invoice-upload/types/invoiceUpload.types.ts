export type BatchStatus = "UPLOADED" | "PROCESSING" | "COMPLETED" | "PARTIAL_SUCCESS" | "FAILED";
export type FileStatus = "UPLOADED" | "EXTRACTED" | "FAILED" | "IMPORTED";
export type InvoiceStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "DISPUTED" | "CANCELLED" | "DRAFT";
export type ReviewReason = 
  | "EXTRACTION_FAILED"
  | "DUPLICATE_INVOICE"
  | "INVALID_TOTAL"
  | "INVALID_DATE"
  | "CUSTOMER_NOT_FOUND"
  | "VALIDATION_FAILED";
export type ReviewStatus = "PENDING" | "RESOLVED" | "REJECTED";

export interface InvoiceUploadBatch {
  id: string;
  file_name: string;
  total_files: number;
  processed_files: number;
  success_count: number;
  failed_count: number;
  status: BatchStatus;
  uploaded_by: string;
  uploaded_at: string;
  completed_at: string | null;
}

export interface InvoiceUploadFile {
  id: string;
  batch_id: string;
  file_name: string;
  status: FileStatus;
  error_message: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  invoice_date: string;
  due_date: string;
  currency: "INR" | "USD" | "EUR" | "GBP";
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  outstanding_amount: number;
  status: InvoiceStatus;
  batch_id: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
}

export interface ReviewQueueItem {
  id: string;
  batch_id: string;
  invoice_id: string | null;
  review_reason: ReviewReason;
  status: ReviewStatus;
  assigned_to: string | null;
  created_at: string;
}
