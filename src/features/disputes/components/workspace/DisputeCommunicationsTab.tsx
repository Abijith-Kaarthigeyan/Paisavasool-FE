import { Card, CardContent } from "@/components/ui/card"
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
    <Card className="flex max-h-[min(calc(100dvh-22rem),680px)] flex-col overflow-hidden">
      <CardContent className="flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden pt-5">
        <div className="max-h-[300px] space-y-3 overflow-y-auto pr-2">
          {isLoading || isLoadingAttachments ? (
            <Skeleton className="h-20 w-full" />
          ) : communications.length === 0 ? (
            <EmptyState
              title="No correspondence"
              description="No communications have been recorded for this dispute yet."
              className="py-6"
            />
          ) : (
            communications.map((comm, index) => (
              <CommunicationThreadItem
                key={comm.id}
                comm={comm}
                customerEmail={customerEmail}
                caseId={caseId}
                caseAttachments={caseAttachments}
                isFirst={index === 0}
              />
            ))
          )}
        </div>

        <div className="shrink-0 border-t border-border pt-4">
          <AssociateEmailComposer
            customerEmail={customerEmail}
            initialDraft={initialDraft}
            isLoadingDraft={isLoadingDraft}
            isDrafting={isDrafting}
            isSending={isSending}
            onDraft={onDraftEmail}
            onSend={onSendEmail}
          />
        </div>
      </CardContent>
    </Card>
  )
}
