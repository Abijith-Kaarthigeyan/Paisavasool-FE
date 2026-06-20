import { Customer } from "@/features/invoices/types"

export type CollectionStatus = 
  | "OPEN" 
  | "IN_PROGRESS" 
  | "PROMISED" 
  | "ESCALATED" 
  | "DISPUTED" 
  | "CLOSED";

export type CollectionPriority = "LOW" | "MEDIUM" | "HIGH";

export type AgingBucket = "CURRENT" | "0-30" | "31-60" | "61-90" | "90_PLUS";

export interface CollectionCase {
  id: string;
  invoice_id: string;
  customer_id: string;
  outstanding_amount_snapshot: number;
  aging_bucket: AgingBucket;
  priority: CollectionPriority;
  status: CollectionStatus;
  assigned_to: string | null;
  opened_at: string;
  closed_at: string | null;
  manager_id: string | null;
  escalated_to_manager_id: string | null;
  escalated_at: string | null;
  created_at: string;
  updated_at: string;
  // Enriched local UI fields
  customer?: Customer;
  invoice?: {
    id: string;
    invoice_number: string;
    total_amount: number;
    outstanding_amount: number;
    due_date: string;
    invoice_date: string;
    status: string;
  };
  assigned_associate_name?: string;
  manager_name?: string;
  escalated_manager_name?: string;
  activities?: CollectionActivity[];
  promises?: PaymentPromise[];
  reminders?: ReminderHistory[];
}

export type ActivityType =
  | "EMAIL_SENT"
  | "CALL_MADE"
  | "FOLLOW_UP"
  | "PROMISE_CREATED"
  | "PROMISE_BROKEN"
  | "ESCALATED"
  | "PAYMENT_RECEIVED"
  | "CASE_CLOSED"
  | "CASE_ASSIGNED"
  | "AGING_BUCKET_CHANGED"
  | string;

export interface CollectionActivity {
  id: string;
  collection_case_id: string;
  activity_type: ActivityType;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
  performed_by_name?: string; // Enriched fields
}

export type PromiseStatus = "ACTIVE" | "FULFILLED" | "BROKEN";

export interface PaymentPromise {
  id: string;
  collection_case_id: string;
  promised_amount: number;
  promised_date: string;
  status: PromiseStatus;
  created_at: string;
  updated_at: string;
  // Enriched fields
  customer_name?: string;
  invoice_number?: string;
  assigned_associate_name?: string;
}

export type ReminderStatus = "PENDING" | "SENT" | "FAILED" | "CANCELLED";

export interface ReminderHistory {
  id: string;
  collection_case_id: string;
  template_id: string;
  reminder_number: number;
  subject: string;
  body: string;
  status: ReminderStatus;
  scheduled_at: string;
  sent_to: string;
  sent_at: string | null;
  created_at: string;
  // Enriched fields
  customer_name?: string;
  invoice_number?: string;
}

export interface CollectionAnalytics {
  open_cases: number;
  escalated_cases: number;
  broken_promises: number;
  collected_amount: number;
  collection_effectiveness: number;
}

export interface AgingAnalytics {
  outstanding_amount: number;
  CURRENT: number;
  "0-30": number;
  "31-60": number;
  "61-90": number;
  "90_PLUS": number;
}
