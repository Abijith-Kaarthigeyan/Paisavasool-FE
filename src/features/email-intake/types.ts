export type EmailClassification = "PAYMENT" | "DISPUTE" | "OTHER" | string

export type EmailManualAction = "ROUTE_PAYMENT" | "ROUTE_DISPUTE" | "DISMISS"

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
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface EmailManualActionRequest {
  action: EmailManualAction
  reason?: string | null
}
