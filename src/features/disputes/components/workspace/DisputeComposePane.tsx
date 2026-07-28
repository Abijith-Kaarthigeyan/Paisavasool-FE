import { useEffect, useRef } from "react"
import ReactDOM from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFocusTrap } from "@/lib/use-focus-trap"
import { AssociateEmailComposer } from "./AssociateEmailComposer"
import type {
  AssociateCommunicationSendPayload,
  DisputeCommunicationDraft,
} from "../../types"

interface DisputeComposePaneProps {
  open: boolean
  commsSheetOpen: boolean
  customerEmail: string | null
  allowPauseSlaTillReply?: boolean
  initialDraft?: DisputeCommunicationDraft | null
  isLoadingDraft?: boolean
  isDrafting?: boolean
  isSending?: boolean
  onClose: () => void
  onDraft: (instructions?: string) => Promise<DisputeCommunicationDraft>
  onSend: (payload: AssociateCommunicationSendPayload) => Promise<void>
  onSent?: () => void
}

export function DisputeComposePane({
  open,
  commsSheetOpen,
  customerEmail,
  allowPauseSlaTillReply = false,
  initialDraft,
  isLoadingDraft,
  isDrafting,
  isSending,
  onClose,
  onDraft,
  onSend,
  onSent,
}: DisputeComposePaneProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  useFocusTrap(contentRef, open)

  useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, onClose])

  if (!open || typeof window === "undefined") return null

  return ReactDOM.createPortal(
    <div
      ref={contentRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispute-compose-pane-title"
      className={cn(
        "fixed inset-y-0 z-[60] flex h-svh flex-col border-r border-border bg-card shadow-popover animate-in fade-in duration-200",
        "left-0 md:left-60",
        commsSheetOpen ? "right-0 sm:right-[36rem]" : "right-0"
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-6 pb-4 pt-6">
        <div className="min-w-0 pr-8">
          <h2 id="dispute-compose-pane-title" className="text-lg font-semibold text-foreground">
            Compose reply
          </h2>
          {customerEmail ? (
            <p className="mt-1 text-sm text-muted-foreground">{customerEmail}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close compose pane"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2"
        >
          <X className="h-5 w-5 text-muted-foreground" aria-hidden />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-4">
        <AssociateEmailComposer
          customerEmail={customerEmail}
          allowPauseSlaTillReply={allowPauseSlaTillReply}
          initialDraft={initialDraft}
          isLoadingDraft={isLoadingDraft}
          isDrafting={isDrafting}
          isSending={isSending}
          mode="full"
          onDraft={onDraft}
          onSend={onSend}
          onSent={onSent}
        />
      </div>
    </div>,
    document.body
  )
}
