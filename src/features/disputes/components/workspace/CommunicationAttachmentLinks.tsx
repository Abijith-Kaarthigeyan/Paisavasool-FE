import { useState } from "react"
import { FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import type { CaseAttachment } from "../../types"
import { disputeService } from "../../services/disputeService"

interface CommunicationAttachmentLinksProps {
  caseId?: string | null
  attachments: CaseAttachment[]
}

function isDownloadableAttachment(
  caseId: string | null | undefined,
  attachment: CaseAttachment
): boolean {
  return !!caseId && !attachment.id.startsWith("body-attachment-")
}

export function CommunicationAttachmentLinks({
  caseId,
  attachments,
}: CommunicationAttachmentLinksProps) {
  const { toast } = useToast()
  const [openingId, setOpeningId] = useState<string | null>(null)

  const handleOpen = async (attachment: CaseAttachment) => {
    if (!caseId || !isDownloadableAttachment(caseId, attachment)) {
      return
    }

    const newTab = window.open("about:blank", "_blank", "noopener,noreferrer")
    setOpeningId(attachment.id)
    try {
      const blob = await disputeService.downloadCaseAttachmentFile(caseId, attachment.id)
      const pdfBlob =
        blob.type === "application/pdf"
          ? blob
          : new Blob([blob], { type: "application/pdf" })
      const url = URL.createObjectURL(pdfBlob)

      if (newTab) {
        newTab.location.href = url
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
        return
      }

      URL.revokeObjectURL(url)
      toast({
        title: "Popup blocked",
        description: "Allow popups to open the PDF in a new tab.",
        type: "error",
      })
    } catch {
      newTab?.close()
      toast({
        title: "Could not open attachment",
        description: `Failed to load ${attachment.filename}.`,
        type: "error",
      })
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <p className="text-xs font-medium text-muted-foreground">Attachments:</p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {attachments.map((attachment) => {
          const isOpening = openingId === attachment.id
          const canDownload = isDownloadableAttachment(caseId, attachment)
          const icon = isOpening ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
          ) : (
            <FileText className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          )

          return (
            <li key={attachment.id}>
              {canDownload ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto justify-start px-0 py-0.5 text-sm font-normal text-primary hover:bg-transparent hover:underline"
                  disabled={isOpening}
                  onClick={() => handleOpen(attachment)}
                >
                  {icon}
                  {attachment.filename}
                </Button>
              ) : (
                <span className="inline-flex items-center py-0.5 text-sm text-foreground">
                  {icon}
                  {attachment.filename}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
