import { Invoice } from "@/features/invoices/types"

export type DisputeStatus =
  | "OPEN"
  | "IN_REVIEW"
  | "WAITING_CUSTOMER"
  | "WAITING_INTERNAL"
  | "WAITING_INTERNAL_TEAM"
  | "WAITING_ASSOCIATE_APPROVAL"
  | "WAITING_PAYMENT_REVIEW"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED"
  | "FAILED";

export type SLAStatus = "ON_TRACK" | "AT_RISK" | "BREACHED" | "CLOSED";

export type DisputeResolutionMethod = "PHONE" | "IN_PERSON" | "EMAIL" | "OTHER";
export type DisputeCloseOutcome = "CUSTOMER_CORRECT" | "COMPANY_CORRECT";

export interface DisputeClosePayload {
  resolution_method: DisputeResolutionMethod;
  resolution_outcome: DisputeCloseOutcome;
  comments: string;
}

export interface DisputeSLA {
  id: string;
  dispute_id: string;
  sla_minutes: number;
  started_at: string;
  paused_at: string | null;
  resumed_at: string | null;
  breached_at: string | null;
  is_paused: boolean;
  current_percentage: number;
  accumulated_paused_minutes: number;
  status: SLAStatus;
}

export interface Dispute {
  id: string;
  dispute_number: string;
  case_id: string;
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  dispute_category: string;
  status: DisputeStatus | string;
  resolution_outcome: string | null;
  assigned_to: string | null;
  manager_id: string | null;
  opened_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Enriched properties (joined in frontend hooks)
  invoice?: Partial<Invoice>;
  customer?: {
    id: string;
    customer_code: string;
    customer_name: string;
    email: string | null;
  };
  assigned_user_name?: string;
  manager_name?: string;
  sla?: DisputeSLA;
}

export interface DisputeCase {
  id: string;
  case_number: string;
  customer_email: string;
  email_subject: string | null;
  email_body: string | null;
  raw_content?: string | null;
  original_message_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  
  // Enriched properties
  disputes?: Dispute[];
  dispute_count?: number;
}

export interface CaseAttachment {
  id: string;
  filename: string;
  mime_type: string;
  created_at: string;
}

export interface DisputeAssignment {
  id: string;
  dispute_id: string;
  assigned_to: string;
  assigned_by: string;
  assigned_at: string;
  deactivated_at: string | null;
  is_active: boolean;
}

export interface DisputeActivity {
  id: string;
  dispute_id: string;
  activity_type: string;
  activity_metadata: any | null;
  performed_by: string | null;
  created_at: string;
}

export interface DisputeComment {
  id: string;
  dispute_id: string;
  comment: string;
  comment_type: "INTERNAL" | "CUSTOMER" | "SYSTEM";
  created_by: string;
  created_at: string;
  
  // Enriched
  created_by_name?: string;
}

export interface DisputeResolutionRecommendation {
  id: string;
  dispute_id: string;
  recommended_action: string;
  recommended_invoice_json: any | null;
  confidence: number;
  created_by_agent: string;
  created_at: string;
}

export interface DisputeCommunication {
  id: string;
  dispute_id: string;
  recipient: string;
  subject: string;
  message_body: string;
  communication_type: "CUSTOMER" | "INTERNAL" | "ASSOCIATE_OUTBOUND" | string;
  gmail_message_id?: string | null;
  rfc_message_id?: string | null;
  sent_time: string;
  created_at: string;
}

export interface OutboundEmailAttachment {
  filename: string;
  content_base64: string;
  mime_type?: string;
}

export interface AssociateCommunicationSendPayload {
  recipient: string;
  subject: string;
  body: string;
  attachments?: OutboundEmailAttachment[];
}

export interface DisputeCommunicationDraft {
  id?: string;
  recipient: string;
  subject: string;
  body: string;
  status?: string;
  created_at?: string;
}

export interface DisputeEvidenceSnapshot {
  id: string;
  dispute_id: string;
  snapshot_type: string;
  snapshot_data: any;
  created_at: string;
}

export interface DisputeEscalation {
  id: string;
  dispute_id: string;
  level: number;
  reason: string | null;
  escalated_to: string;
  escalated_at: string;
  resolved: boolean;
  
  // Enriched
  manager_name?: string;
}

export interface DisputeWorkflowContext {
  id: string;
  dispute_id: string;
  workflow_name: string;
  current_node: string;
  workflow_state: any;
  last_checkpoint: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DisputeReviewQueueItem {
  id: string;
  dispute_id: string;
  review_reason: string;
  assigned_to: string | null;
  status: "PENDING" | "RESOLVED" | "FAILED";
  error_message: string | null;
  stack_trace: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
  
  // Enriched
  dispute?: Dispute;
}
