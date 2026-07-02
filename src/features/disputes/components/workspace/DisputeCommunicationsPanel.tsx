import { useEffect, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import type {
  CaseAttachment,
  DisputeCommunication,
  DisputeCommunicationDraft,
  AssociateCommunicationSendPayload,
} from "../../types"
import { CommunicationThreadItem } from "./CommunicationThreadItem"
import { AssociateEmailComposer } from "./AssociateEmailComposer"

interface DisputeCommunicationsPanelProps {
  communications: DisputeCommunication[]
  customerEmail: string | null
  allowPauseSlaTillReply?: boolean
  caseId?: string | null
  caseAttachments?: CaseAttachment[]
  isLoading?: boolean
  isLoadingAttachments?: boolean
  initialDraft?: DisputeCommunicationDraft | null
  isLoadingDraft?: boolean
  isDrafting?: boolean
  isSending?: boolean
  isOpen?: boolean
  onOpenCompose: () => void
  onDraftEmail: (instructions?: string) => Promise<DisputeCommunicationDraft>
  onSendEmail: (payload: AssociateCommunicationSendPayload) => Promise<void>
}

export function DisputeCommunicationsPanel({
  communications,
  customerEmail,
  caseId,
  caseAttachments = [],
  isLoading,
  isLoadingAttachments,
  initialDraft,
  isLoadingDraft,
  isOpen = true,
  onOpenCompose,
  onDraftEmail,
  onSendEmail,
}: DisputeCommunicationsPanelProps) {
  const threadEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || isLoading || communications.length === 0) return
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [isOpen, isLoading, communications.length, communications])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/10 px-1 py-3">
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
              layout="panel"
            />
          ))
        )}
        <div ref={threadEndRef} aria-hidden />
      </div>

      <div className="shrink-0 border-t border-border bg-card p-3">
        <AssociateEmailComposer
          customerEmail={customerEmail}
          initialDraft={initialDraft}
          isLoadingDraft={isLoadingDraft}
          mode="trigger"
          onOpen={onOpenCompose}
          onDraft={onDraftEmail}
          onSend={onSendEmail}
        />
      </div>
    </div>
  )
}
