import { Link } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  normalizeConfidence,
  parseRecommendationAction,
} from "../../utils/disputeFormatters"
import { isPaymentDisputeCategory } from "../../utils/disputeWorkspaceUtils"
import type {
  Dispute,
  DisputeCase,
  DisputeCommunication,
  DisputeEvidenceSnapshot,
  DisputeResolutionRecommendation,
} from "../../types"

interface DisputeOverviewTabProps {
  dispute: Dispute
  disputeCase?: DisputeCase | null
  evidence?: DisputeEvidenceSnapshot[]
  latestRecommendation?: DisputeResolutionRecommendation | null
  allCommunications?: DisputeCommunication[]
}

function ValidationSummary({ evidence }: { evidence: DisputeEvidenceSnapshot[] }) {
  const snapshot = evidence.find(
    (e) =>
      e.snapshot_type.includes("validation") || e.snapshot_type.includes("VALIDATION")
  )
  if (!snapshot?.snapshot_data) return null

  const data = snapshot.snapshot_data as Record<string, unknown>
  const bullets: string[] = []

  if (data.payment_status) bullets.push(`Payment status: ${String(data.payment_status)}`)
  if (data.invoice_status) bullets.push(`Invoice status: ${String(data.invoice_status)}`)
  if (data.payment_reference || data.utr || data.reference) {
    bullets.push(
      `Reference: ${String(data.payment_reference || data.utr || data.reference)}`
    )
  }
  if (data.reason) bullets.push(String(data.reason))
  if (data.validation_result) bullets.push(String(data.validation_result))

  if (bullets.length === 0) return null

  return (
    <Card className="border-border bg-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Payment validation</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function DisputeOverviewTab({
  dispute,
  disputeCase,
  evidence = [],
  latestRecommendation,
  allCommunications = [],
}: DisputeOverviewTabProps) {
  const isWaitingCustomer = dispute.status === "WAITING_CUSTOMER"
  const isWaitingInternal =
    dispute.status === "WAITING_INTERNAL" || dispute.status === "WAITING_INTERNAL_TEAM"

  const lastComm = allCommunications[allCommunications.length - 1]
  const lastCommBody =
    lastComm?.message_body?.slice(0, 160) ||
    (lastComm as { body?: string })?.body?.slice(0, 160)

  const parsedRec = latestRecommendation
    ? parseRecommendationAction(latestRecommendation.recommended_action)
    : null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dispute summary</CardTitle>
          <CardDescription>Category, resolution status, and case linkage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Dispute number</span>
              <p className="mt-0.5 font-medium text-foreground">{dispute.dispute_number}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Category</span>
              <p className="mt-0.5 font-medium text-foreground">{dispute.dispute_category}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Resolution outcome</span>
              <p className="mt-0.5 font-medium text-foreground">
                {dispute.resolution_outcome || "Pending validation"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Status</span>
              <p className="mt-0.5 font-medium text-foreground">
                {dispute.status.replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Opened</span>
              <p className="mt-0.5 font-medium tabular-nums text-foreground">
                {new Date(dispute.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Last updated</span>
              <p className="mt-0.5 font-medium tabular-nums text-foreground">
                {new Date(dispute.updated_at).toLocaleString()}
              </p>
            </div>
          </div>

          {disputeCase && (
            <div className="border-t border-border pt-4">
              <span className="text-muted-foreground">Parent case</span>
              <p className="mt-1">
                <Link
                  to={`/disputes/cases/${dispute.case_id}`}
                  className="font-medium text-primary hover:underline"
                >
                  Case {disputeCase.case_number}
                </Link>
              </p>
            </div>
          )}

          {dispute.manager_name && (
            <div className="border-t border-border pt-4">
              <span className="text-muted-foreground">Escalation manager</span>
              <p className="mt-0.5 font-medium text-foreground">{dispute.manager_name}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {(isWaitingCustomer || isWaitingInternal) && (
        <Card className="border-warning/20 bg-warning-muted/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {isWaitingCustomer ? "Waiting on customer" : "Waiting on internal team"}
            </CardTitle>
            <CardDescription>
              Since {new Date(dispute.updated_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          {lastCommBody && (
            <CardContent>
              <p className="text-sm italic text-muted-foreground">
                Latest message: &ldquo;{lastCommBody}
                {lastCommBody.length >= 160 ? "…" : ""}&rdquo;
              </p>
            </CardContent>
          )}
        </Card>
      )}

      {dispute.dispute_category === "AMENDMENT" && parsedRec && latestRecommendation && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Latest AI recommendation</CardTitle>
            <CardDescription>
              Confidence {normalizeConfidence(latestRecommendation.confidence).toFixed(0)}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Badge variant="outline" shape="pill">
              {parsedRec.outcome}
            </Badge>
            {parsedRec.reasoning && (
              <p className="text-muted-foreground">{parsedRec.reasoning}</p>
            )}
            <p className="text-xs text-muted-foreground">
              See Recommendations tab or the attention panel for full details and actions.
            </p>
          </CardContent>
        </Card>
      )}

      {isPaymentDisputeCategory(dispute.dispute_category) && (
        <ValidationSummary evidence={evidence} />
      )}
    </div>
  )
}
