import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import type { CaseAttachment, DisputeCommunication, DisputeCommunicationDraft, AssociateCommunicationSendPayload } from "../../types"
import { CommunicationThreadItem } from "./CommunicationThreadItem"
import { AssociateEmailComposer } from "./AssociateEmailComposer"

interface DisputeCommunicationsTabProps {
  communications: DisputeCommunication[]
  customerEmail: string | null
  caseId?: string | null
  caseAttachments?: CaseAttachment[]
  isLoading?: boolean
  isLoadingAttachments?: boolean
  initialDraft?: DisputeCommunicationDraft | null
  isLoadingDraft?: boolean
  isDrafting?: boolean
  isSending?: boolean
  onDraftEmail: (instructions?: string) => Promise<DisputeCommunicationDraft>
  onSendEmail: (payload: AssociateCommunicationSendPayload) => Promise<void>
}

export function DisputeCommunicationsTab({
  communications,
  customerEmail,
  caseId,
  caseAttachments = [],
  isLoading,
  isLoadingAttachments,
  initialDraft,
  isLoadingDraft,
  isDrafting,
  isSending,
  onDraftEmail,
  onSendEmail,
}: DisputeCommunicationsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Communications</CardTitle>
        <CardDescription>
          Email thread — received on the left, sent on the right. Outbound messages are delivered
          via Gmail when sending is enabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading || isLoadingAttachments ? (
          <Skeleton className="h-32 w-full" />
        ) : communications.length === 0 ? (
          <EmptyState
            title="No correspondence"
            description="No communications have been recorded for this dispute yet."
            className="py-8"
          />
        ) : (
          <div className="space-y-6">
            {communications.map((comm, index) => (
              <CommunicationThreadItem
                key={comm.id}
                comm={comm}
                customerEmail={customerEmail}
                caseId={caseId}
                caseAttachments={caseAttachments}
                isFirst={index === 0}
              />
            ))}
          </div>
        )}

        <AssociateEmailComposer
          customerEmail={customerEmail}
          initialDraft={initialDraft}
          isLoadingDraft={isLoadingDraft}
          isDrafting={isDrafting}
          isSending={isSending}
          onDraft={onDraftEmail}
          onSend={onSendEmail}
        />
      </CardContent>
    </Card>
  )
}
