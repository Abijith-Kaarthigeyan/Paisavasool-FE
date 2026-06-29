import { useState } from "react"
import { FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import type { CaseAttachment } from "../../types"
import { disputeService } from "../../services/disputeService"

interface CommunicationAttachmentLinksProps {
  caseId?: string | null
  attachments: CaseAttachment[]
  hasStoredFiles?: boolean
}

function isDownloadableAttachment(
  caseId: string | null | undefined,
  attachment: CaseAttachment,
  hasStoredFiles: boolean
): boolean {
  return hasStoredFiles && !!caseId && !attachment.id.startsWith("body-attachment-")
}

export function CommunicationAttachmentLinks({
  caseId,
  attachments,
  hasStoredFiles = false,
}: CommunicationAttachmentLinksProps) {
  const { toast } = useToast()
  const [openingId, setOpeningId] = useState<string | null>(null)

  const handleOpen = (attachment: CaseAttachment) => {
    if (!caseId || !isDownloadableAttachment(caseId, attachment, hasStoredFiles)) {
      return
    }

    const previewTab = window.open("about:blank", "_blank")
    setOpeningId(attachment.id)

    disputeService
      .openCaseAttachmentInTab(previewTab, caseId, attachment.id, attachment.filename)
      .catch((error) => {
        if (previewTab && !previewTab.closed) {
          previewTab.close()
        }

        toast({
          title: "Could not open attachment",
          description: hasStoredFiles
            ? `Failed to load ${attachment.filename}. The file may be missing from storage.`
            : `Failed to load ${attachment.filename}.`,
          type: "error",
        })
        console.error(error)
      })
      .finally(() => {
        setOpeningId(null)
      })
  }

  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <p className="text-xs font-medium text-muted-foreground">Attachments:</p>
      {!hasStoredFiles && (
        <p className="mt-1 text-xs text-muted-foreground">
          Filename only — the PDF is not linked to this dispute yet.
        </p>
      )}
      <ul className="mt-1.5 flex flex-col gap-1">
        {attachments.map((attachment) => {
          const isOpening = openingId === attachment.id
          const canDownload = isDownloadableAttachment(caseId, attachment, hasStoredFiles)
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
                <span className="inline-flex items-center py-0.5 text-sm text-muted-foreground">
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
