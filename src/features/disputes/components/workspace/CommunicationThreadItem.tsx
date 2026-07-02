import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Inbox, Send } from "lucide-react"
import type { CaseAttachment, DisputeCommunication } from "../../types"
import {
  getCommunicationAddress,
  getCommunicationDeliveryLabel,
  getCommunicationDirection,
  getCommunicationPreview,
  isAssociateOutboundCommunication,
  isCaseOriginCommunication,
  isCommunicationDelivered,
  isInternalCommunication,
  extractAttachmentFilenamesFromBody,
  extractComposeAttachmentFilenamesFromBody,
  formatCommunicationBodyForDisplay,
  messageHasAttachmentContent,
} from "../../utils/disputeFormatters"
import { CommunicationAttachmentLinks } from "./CommunicationAttachmentLinks"

interface CommunicationThreadItemProps {
  comm: DisputeCommunication
  customerEmail: string | null
  caseId?: string | null
  caseAttachments?: CaseAttachment[]
  isFirst?: boolean
  layout?: "inline" | "panel"
}

function getCommunicationBody(comm: DisputeCommunication) {
  return comm.message_body || (comm as { body?: string }).body || ""
}

function getCommunicationTime(comm: DisputeCommunication) {
  return comm.sent_time || comm.created_at || (comm as { created_at?: string }).created_at
}

export function CommunicationThreadItem({
  comm,
  customerEmail,
  caseId,
  caseAttachments = [],
  isFirst = false,
  layout = "inline",
}: CommunicationThreadItemProps) {
  const [isExpanded, setIsExpanded] = useState(isFirst)
  const isCaseOrigin = isCaseOriginCommunication(comm)
  const direction = getCommunicationDirection(comm, { isCaseOrigin })
  const isSent = direction === "Sent"
  const address = getCommunicationAddress(comm, customerEmail, { isCaseOrigin })
  const body = getCommunicationBody(comm)
  const displayBody = formatCommunicationBodyForDisplay(body)
  const time = getCommunicationTime(comm)
  const isInternal = isInternalCommunication(comm)
  const isAssociate = isAssociateOutboundCommunication(comm)
  const deliveryLabel = getCommunicationDeliveryLabel(comm)
  const isDelivered = isCommunicationDelivered(comm)
  const hasAttachmentSection = messageHasAttachmentContent(body)
  const attachmentFilenamesFromBody = [
    ...extractAttachmentFilenamesFromBody(body),
    ...extractComposeAttachmentFilenamesFromBody(body),
  ]
  const hasStoredFiles = caseAttachments.length > 0
  const attachmentsToShow = hasStoredFiles
      ? caseAttachments
      : attachmentFilenamesFromBody.map((filename, index) => ({
          id: `body-attachment-${index}`,
          filename,
          mime_type: "application/pdf",
          created_at: "",
        }))
  const isInboundCustomer =
    !isSent && comm.communication_type === "CUSTOMER"
  const showAttachments =
    isExpanded &&
    attachmentsToShow.length > 0 &&
    (isCaseOrigin ||
      hasAttachmentSection ||
      (hasStoredFiles && isInboundCustomer && isFirst))

  return (
    <div
      className={cn(
        "flex w-full",
        isSent ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "rounded-lg border text-sm transition-colors",
          layout === "panel" ? "max-w-[95%]" : "max-w-[88%]",
          isSent
            ? "border-primary/20 bg-primary/[0.03]"
            : "border-border bg-card",
          isExpanded ? "p-4" : "p-3"
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full",
              isSent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}
            aria-hidden
          >
            {isSent ? <Send className="h-3 w-3" /> : <Inbox className="h-3 w-3" />}
          </span>
          <Badge variant={isSent ? "default" : "outline"} shape="pill">
            {direction}
          </Badge>
          {isInternal && (
            <Badge variant="outline" shape="pill">
              Internal
            </Badge>
          )}
          {isAssociate && (
            <Badge variant="secondary" shape="pill">
              Associate
            </Badge>
          )}
          {isAssociate && comm.pause_sla_till_reply && (
            <Badge variant="outline" shape="pill" title="SLA paused until customer replies">
              SLA paused
            </Badge>
          )}
          {deliveryLabel && (
            <Badge
              variant={isDelivered ? "success" : "warning"}
              shape="pill"
              title={
                isDelivered
                  ? "Delivered through Gmail"
                  : "Saved in the dispute thread; Gmail delivery is pending or disabled"
              }
            >
              {deliveryLabel}
            </Badge>
          )}
          <span className="truncate font-mono text-xs text-muted-foreground">
            {isSent ? `To: ${address}` : `From: ${address}`}
          </span>
          {time && (
            <time className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
              {new Date(time).toLocaleString()}
            </time>
          )}
        </div>

        <p className="mt-2 font-medium text-foreground">{comm.subject}</p>

        {isCaseOrigin && isFirst && (
          <div className="mt-2 space-y-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <div className="flex justify-between gap-4">
              <span>From</span>
              <span className="font-medium text-foreground">{address}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Subject</span>
              <span className="max-w-[60%] truncate font-medium text-foreground">
                {comm.subject}
              </span>
            </div>
          </div>
        )}

        {isExpanded ? (
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {displayBody}
          </div>
        ) : (
          displayBody && (
            <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {getCommunicationPreview(displayBody)}
            </p>
          )
        )}

        {showAttachments && (
          <CommunicationAttachmentLinks
            caseId={caseId}
            attachments={attachmentsToShow}
            hasStoredFiles={hasStoredFiles}
          />
        )}

        {displayBody && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 px-2 text-xs text-muted-foreground"
            onClick={() => setIsExpanded((v) => !v)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="mr-1 h-3 w-3" aria-hidden />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-3 w-3" aria-hidden />
                Show full message
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
