import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { AiAgentCard } from "@/components/ui/ai-agent-card"
import { InvoiceAmendmentDiff } from "./InvoiceAmendmentDiff"
import {
  normalizeConfidence,
  parseRecommendationAction,
} from "../../utils/disputeFormatters"
import type { Dispute, DisputeResolutionRecommendation } from "../../types"
import type { InvoiceItem } from "@/features/invoices/types"

interface DisputeRecommendationsTabProps {
  recommendations: DisputeResolutionRecommendation[]
  dispute?: Dispute
  invoiceItems?: InvoiceItem[]
  isLoading?: boolean
}

export function DisputeRecommendationsTab({
  recommendations,
  dispute,
  invoiceItems = [],
  isLoading,
}: DisputeRecommendationsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[300px] space-y-4 overflow-y-auto pr-2">
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : recommendations.length === 0 ? (
            <EmptyState
              title="No recommendations"
              description="The AI agent has not generated recommendations for this dispute yet."
              className="py-6"
            />
          ) : (
            recommendations.map((rec) => {
              const parsed = parseRecommendationAction(rec.recommended_action)
              const confidence = normalizeConfidence(rec.confidence)

              return (
                <AiAgentCard
                  key={rec.id}
                  agentName={rec.created_by_agent}
                  stage={parsed.outcome}
                  stageLabel="Suggested action"
                  confidence={confidence}
                  status="complete"
                >
                  {parsed.reasoning && (
                    <p className="text-sm leading-relaxed text-muted-foreground">{parsed.reasoning}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Generated {new Date(rec.created_at).toLocaleString()}
                  </p>
                  {rec.recommended_invoice_json && dispute && (
                    <InvoiceAmendmentDiff
                      dispute={dispute}
                      invoiceItems={invoiceItems}
                      proposedInvoice={rec.recommended_invoice_json as Record<string, unknown>}
                    />
                  )}
                </AiAgentCard>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
