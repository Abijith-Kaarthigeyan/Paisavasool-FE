import type { BreadcrumbItem } from "@/components/ui/page-breadcrumb"

const DISPUTE_LIST_LABELS: Record<string, string> = {
  "/disputes/open": "Open Disputes",
  "/disputes/all": "All disputes",
  "/disputes/assigned": "My Assigned Disputes",
  "/disputes/escalated": "Escalated disputes",
  "/disputes/review-queue": "Dispute review queue",
  "/disputes/waiting-customer": "Waiting for customer",
  "/disputes/waiting-internal": "Waiting for internal teams",
  "/disputes/cases": "Intake email cases",
}

export interface DisputeListContext {
  path: string
  label?: string
}

export function buildDisputeDetailPath(
  disputeId: string,
  from: DisputeListContext
): string {
  const params = new URLSearchParams({ from: from.path })
  if (from.label) {
    params.set("fromLabel", from.label)
  }
  return `/disputes/${disputeId}?${params.toString()}`
}

export function resolveDisputeListBreadcrumb(
  fromPath: string | null,
  fromLabel?: string | null
): BreadcrumbItem | null {
  if (!fromPath) return null

  if (fromLabel) {
    return { label: fromLabel, to: fromPath }
  }

  const pathname = new URL(fromPath, window.location.origin).pathname
  const label = DISPUTE_LIST_LABELS[pathname]
  if (!label) return null

  return { label, to: fromPath }
}

export function buildDisputeDetailBreadcrumbs(
  disputeNumber: string,
  fromPath: string | null,
  fromLabel?: string | null
): BreadcrumbItem[] {
  const listCrumb = resolveDisputeListBreadcrumb(fromPath, fromLabel)

  return [
    { label: "Disputes", to: "/disputes" },
    ...(listCrumb ? [listCrumb] : []),
    { label: disputeNumber },
  ]
}
