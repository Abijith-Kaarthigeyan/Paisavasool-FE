export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PaymentReviewResponse {
  id: string;
  payment_id: string;
  review_reason: string;
  confidence: number;
  status: ReviewStatus;
  assigned_to: string | null;
  created_at: string;
}

export interface PaymentDetailsResponse {
  id: string;
  payment_upload_id: string;
  customer_id: string | null;
  customer_name_original: string;
  payment_reference: string | null;
  payment_amount: number;
  payment_date: string;
  currency: string;
  status: string;
  created_at: string;
}

export interface AllocationInput {
  invoice_id: string;
  amount: number;
}

export interface PaymentReviewApproveRequest {
  resolved_customer_id?: string | null;
  explicit_allocations?: AllocationInput[] | null;
}
