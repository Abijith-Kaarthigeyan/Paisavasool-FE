import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type {
  CaseAttachment,
  DisputeCommunication,
  DisputeCommunicationDraft,
  AssociateCommunicationSendPayload,
} from "../../types"
import { DisputeCommunicationsPanel } from "./DisputeCommunicationsPanel"

interface DisputeCommunicationsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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
  onOpenCompose: () => void
  onDraftEmail: (instructions?: string) => Promise<DisputeCommunicationDraft>
  onSendEmail: (payload: AssociateCommunicationSendPayload) => Promise<void>
}

export function DisputeCommunicationsSheet({
  open,
  onOpenChange,
  communications,
  customerEmail,
  allowPauseSlaTillReply = false,
  caseId,
  caseAttachments = [],
  isLoading,
  isLoadingAttachments,
  initialDraft,
  isLoadingDraft,
  isDrafting,
  isSending,
  onOpenCompose,
  onDraftEmail,
  onSendEmail,
}: DisputeCommunicationsSheetProps) {
  const messageLabel =
    communications.length === 1 ? "1 message" : `${communications.length} messages`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full max-w-xl flex-col overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="shrink-0 px-6 pt-6">
          <SheetTitle>Customer correspondence</SheetTitle>
          <SheetDescription>
            {messageLabel}
            {customerEmail ? ` · ${customerEmail}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4">
          <DisputeCommunicationsPanel
            communications={communications}
            customerEmail={customerEmail}
            allowPauseSlaTillReply={allowPauseSlaTillReply}
            caseId={caseId}
            caseAttachments={caseAttachments}
            isLoading={isLoading}
            isLoadingAttachments={isLoadingAttachments}
            initialDraft={initialDraft}
            isLoadingDraft={isLoadingDraft}
            isDrafting={isDrafting}
            isSending={isSending}
            isOpen={open}
            onOpenCompose={onOpenCompose}
            onDraftEmail={onDraftEmail}
            onSendEmail={onSendEmail}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
