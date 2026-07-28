import type { ReminderHistory, ReminderStatus } from "../types"

const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  SENT: "Sent",
  PENDING: "Pending delivery",
  FAILED: "Delivery failed",
  CANCELLED: "Cancelled",
}

const REMINDER_STATUS_DESCRIPTIONS: Record<ReminderStatus, string> = {
  SENT: "Delivered via Gmail.",
  PENDING: "Generated but not yet delivered. Sending may be disabled or still queued.",
  FAILED: "Gmail delivery failed. The reminder remains eligible for retry.",
  CANCELLED: "Cancelled before delivery.",
}

export function getReminderStatusLabel(status: ReminderStatus | string): string {
  return REMINDER_STATUS_LABELS[status as ReminderStatus] ?? status
}

export function getReminderStatusDescription(status: ReminderStatus | string): string {
  return REMINDER_STATUS_DESCRIPTIONS[status as ReminderStatus] ?? ""
}

export function getReminderDisplayDate(reminder: ReminderHistory): string {
  if (reminder.status === "SENT" && reminder.sent_at) {
    return reminder.sent_at
  }
  return reminder.scheduled_at || reminder.created_at
}

export function isReminderDelivered(reminder: ReminderHistory): boolean {
  return reminder.status === "SENT" && !!reminder.gmail_message_id
}
