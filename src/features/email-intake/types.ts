export type EmailClassification =
  | "PAYMENT"
  | "DISPUTE"
  | "PROMISE"
  | "OTHER"
  | string

export type EmailManualAction =
  | "ROUTE_PAYMENT"
  | "ROUTE_DISPUTE"
  | "ROUTE_PROMISE"
  | "DISMISS"

export interface PromiseExtraction {
  invoice_number?: string | null
  promised_date?: string | null
  promised_amount?: number | null
}

export interface EmailIntakeItem {
  id: string
  message_id: string
  customer_email: string
  email_subject: string | null
  email_body: string | null
  raw_content: string | null
  classification: EmailClassification | null
  confidence: number | null
  reasoning: string[] | null
  routing_status: string
  dispute_case_id: string | null
  payment_upload_id: string | null
  payment_promise_id?: string | null
  extraction?: PromiseExtraction | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface EmailManualActionRequest {
  action: EmailManualAction
  reason?: string | null
  invoice_number?: string | null
  promised_date?: string | null
  promised_amount?: number | null
}

export interface EmailPollResponse {
  unread_found: number
  processed: number
  skipped: number
  failed: number
}
