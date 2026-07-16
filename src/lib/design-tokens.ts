import type { BadgeProps } from "@/components/ui/badge"

export type BadgeVariant = NonNullable<BadgeProps["variant"]>

/** Chart palette derived from brand and semantic tokens (not raw Tailwind colors). */
export const CHART_COLORS = [
  "#4F46E5",
  "#16A34A",
  "#2563EB",
  "#D97706",
  "#6B7280",
  "#9333EA",
  "#0891B2",
  "#DC2626",
] as const

/** Aging bucket bar colors — professional multi-tone palette (Upflow-style). */
export const AGING_BUCKET_CHART_COLORS = [
  "#16A34A",
  "#2563EB",
  "#D97706",
  "#EA580C",
  "#DC2626",
] as const

/** Sidebar nav icon accent colors keyed by nav item label. */
export const NAV_ICON_COLORS: Record<string, { icon: string; activeBg: string }> = {
  Dashboard: { icon: "#4F46E5", activeBg: "#EEF2FF" },
  Billings: { icon: "#2563EB", activeBg: "#EFF6FF" },
  Payments: { icon: "#16A34A", activeBg: "#F0FDF4" },
  Collections: { icon: "#D97706", activeBg: "#FFFBEB" },
  Disputes: { icon: "#DC2626", activeBg: "#FEF2F2" },
  Customers: { icon: "#9333EA", activeBg: "#FAF5FF" },
  "User Management": { icon: "#0891B2", activeBg: "#ECFEFF" },
}

/** SLA health pie/bar segments aligned to semantic chart palette. */
export const SLA_HEALTH_COLORS = {
  healthy: CHART_COLORS[1],
  atRisk: CHART_COLORS[3],
  breached: CHART_COLORS[7],
} as const

export const INVOICE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  PAID: "success",
  PARTIALLY_PAID: "info",
  PENDING: "default",
  OVERDUE: "destructive",
  DISPUTED: "warning",
}

export const PO_STATUS_VARIANT: Record<string, BadgeVariant> = {
  OPEN: "default",
  PARTIALLY_INVOICED: "info",
  CLOSED: "outline",
}

export const PO_LINK_STATUS_VARIANT: Record<string, BadgeVariant> = {
  linked: "success",
  awaiting_match: "warning",
  none: "outline",
}

export const BATCH_STATUS_VARIANT: Record<string, BadgeVariant> = {
  COMPLETED: "success",
  PARTIAL_SUCCESS: "warning",
  PROCESSING: "info",
  UPLOADED: "default",
  FAILED: "destructive",
}

export const INVOICE_REVIEW_REASON_VARIANT: Record<string, BadgeVariant> = {
  EXTRACTION_FAILED: "destructive",
  DUPLICATE_INVOICE: "warning",
  INVALID_TOTAL: "warning",
  INVALID_DATE: "warning",
  VALIDATION_FAILED: "warning",
}

export const INVOICE_FILE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  SUCCESS: "success",
  FAILED: "destructive",
  PROCESSING: "info",
  PENDING: "default",
  PENDING_REVIEW: "warning",
  IMPORTED: "success",
}

export const PAYMENT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  MATCHED: "success",
  PROCESSING: "info",
  UPLOADED: "default",
  REVIEW_REQUIRED: "warning",
  FAILED: "destructive",
}

export const DOCUMENT_SESSION_STATUS_VARIANT: Record<string, BadgeVariant> = {
  CLASSIFYING: "info",
  AWAITING_CONFIRMATION: "warning",
  ROUTING: "info",
  COMPLETED: "success",
  FAILED: "destructive",
}

export const DOCUMENT_FILE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  PENDING_CONFIRMATION: "warning",
  READY: "info",
  ROUTED: "success",
  FAILED: "destructive",
}

export const COLLECTION_STATUS_VARIANT: Record<string, BadgeVariant> = {
  OPEN: "default",
  IN_PROGRESS: "info",
  PROMISED: "success",
  ESCALATED: "destructive",
  DISPUTED: "warning",
  CLOSED: "outline",
}

export const DISPUTE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  OPEN: "default",
  IN_REVIEW: "info",
  WAITING_CUSTOMER: "warning",
  WAITING_INTERNAL: "warning",
  WAITING_INTERNAL_TEAM: "warning",
  WAITING_ASSOCIATE_APPROVAL: "warning",
  WAITING_PAYMENT_REVIEW: "warning",
  RESOLVED: "success",
  CLOSED: "outline",
}

export const PRIORITY_VARIANT: Record<string, BadgeVariant> = {
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "default",
}

export const AGING_BUCKET_VARIANT: Record<string, BadgeVariant> = {
  CURRENT: "success",
  "0-30": "info",
  "31-60": "warning",
  "61-90": "destructive",
  "90_PLUS": "destructive",
}

export const PROMISE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  ACTIVE: "info",
  FULFILLED: "success",
  BROKEN: "destructive",
}

export const REMINDER_STATUS_VARIANT: Record<string, BadgeVariant> = {
  SENT: "success",
  PENDING: "warning",
  FAILED: "destructive",
  CANCELLED: "outline",
}

export const MATCHING_REVIEW_STATUS_VARIANT: Record<string, BadgeVariant> = {
  APPROVED: "success",
  REJECTED: "destructive",
  PENDING: "warning",
}

export const CUSTOMER_PAYMENT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  SETTLED: "success",
  PROCESSING: "warning",
  REVIEW_REQUIRED: "destructive",
}

export const CREDIT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  AVAILABLE: "success",
  USED: "outline",
}

export const USER_ROLE_VARIANT: Record<string, BadgeVariant> = {
  ADMIN: "destructive",
  FINANCE_MANAGER: "success",
  FINANCE_ASSOCIATE: "default",
}

export function getStatusVariant(
  map: Record<string, BadgeVariant>,
  status: string | undefined,
  fallback: BadgeVariant = "outline"
): BadgeVariant {
  if (!status) return fallback
  return map[status] ?? fallback
}

export type ConfidenceLevel = "high" | "medium" | "low"

export const CONFIDENCE_HIGH_THRESHOLD = 90
export const CONFIDENCE_MEDIUM_THRESHOLD = 70

export function getConfidenceLevel(value: number): ConfidenceLevel {
  if (value >= CONFIDENCE_HIGH_THRESHOLD) return "high"
  if (value >= CONFIDENCE_MEDIUM_THRESHOLD) return "medium"
  return "low"
}

export function getConfidenceBadgeVariant(value: number): BadgeVariant {
  const level = getConfidenceLevel(value)
  if (level === "high") return "success"
  if (level === "medium") return "warning"
  return "destructive"
}
