export type BatchStatus = "UPLOADED" | "PROCESSING" | "COMPLETED" | "PARTIAL_SUCCESS" | "FAILED";
export type FileStatus = "UPLOADED" | "EXTRACTED" | "FAILED" | "IMPORTED";
export type InvoiceStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "DISPUTED" | "CANCELLED" | "DRAFT";

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
  files?: InvoiceUploadFile[];
}

export interface InvoiceUploadFile {
  id: string;
  batch_id: string;
  file_name: string;
  status: FileStatus;
  error_message: string | null;
  created_at: string;
}

export interface Customer {
  customer_code: string;
  customer_name: string;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer?: Customer;
  invoice_date: string;
  due_date: string;
  currency: "INR" | "USD" | "EUR" | "GBP";
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  outstanding_amount: number;
  status: InvoiceStatus;
  batch_id: string;
  current_version?: number;
  created_at: string;
  updated_at: string;
}

export interface InvoiceVersionSummary {
  version_number: number;
  change_reason: string | null;
  change_source: string;
  dispute_id: string | null;
  recommendation_id: string | null;
  created_by: string | null;
  created_at: string;
  is_current: boolean;
}

export interface InvoiceVersionDetail {
  version_number: number;
  invoice_snapshot: Record<string, unknown>;
  items_snapshot: Array<Record<string, unknown>>;
  change_reason?: string | null;
  change_source?: string | null;
  dispute_id?: string | null;
  recommendation_id?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  is_current: boolean;
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
