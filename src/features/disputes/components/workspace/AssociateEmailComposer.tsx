import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Send, Loader2, Paperclip, X, PenLine } from "lucide-react"
import type {
  AssociateCommunicationSendPayload,
  DisputeCommunicationDraft,
  OutboundEmailAttachment,
} from "../../types"

const MAX_ATTACHMENTS = 5
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

interface PendingAttachment {
  id: string
  file: File
}

interface AssociateEmailComposerProps {
  customerEmail: string | null
  allowPauseSlaTillReply?: boolean
  initialDraft?: DisputeCommunicationDraft | null
  isLoadingDraft?: boolean
  isDrafting?: boolean
  isSending?: boolean
  mode?: "trigger" | "full"
  onOpen?: () => void
  onDraft: (instructions?: string) => Promise<DisputeCommunicationDraft>
  onSend: (payload: AssociateCommunicationSendPayload) => Promise<void>
  onSent?: () => void
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function getComposePreview(subject: string, body: string): string | null {
  if (subject.trim()) return subject.trim()
  if (body.trim()) {
    const line = body.trim().split("\n")[0]
    return line.length > 80 ? `${line.slice(0, 80)}…` : line
  }
  return null
}

function getDraftPreview(initialDraft?: DisputeCommunicationDraft | null): string | null {
  if (!initialDraft || initialDraft.status === "GENERATING") return null
  return getComposePreview(initialDraft.subject, initialDraft.body)
}

export function AssociateEmailComposer({
  customerEmail,
  allowPauseSlaTillReply = false,
  initialDraft,
  isLoadingDraft,
  isDrafting,
  isSending,
  mode = "full",
  onOpen,
  onDraft,
  onSend,
  onSent,
}: AssociateEmailComposerProps) {
  const [instructions, setInstructions] = useState("")
  const [recipient, setRecipient] = useState(customerEmail || "")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [pauseSlaTillReply, setPauseSlaTillReply] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (customerEmail && !recipient && !hasDraft && !initialDraft) {
      setRecipient(customerEmail)
    }
  }, [customerEmail, recipient, hasDraft, initialDraft])

  useEffect(() => {
    if (!initialDraft || initialDraft.status === "GENERATING") return
    setRecipient(initialDraft.recipient || customerEmail || "")
    setSubject(initialDraft.subject)
    setBody(initialDraft.body)
    setHasDraft(true)
  }, [initialDraft, customerEmail])

  const handleDraft = async () => {
    const draft = await onDraft(instructions.trim() || undefined)
    setRecipient(draft.recipient || customerEmail || "")
    setSubject(draft.subject)
    setBody(draft.body)
    setHasDraft(true)
  }

  const handleAddAttachments = (files: FileList | null) => {
    if (!files?.length) return
    setAttachmentError(null)

    const next: PendingAttachment[] = [...attachments]
    for (const file of Array.from(files)) {
      if (next.length >= MAX_ATTACHMENTS) {
        setAttachmentError(`You can attach at most ${MAX_ATTACHMENTS} PDF files.`)
        break
      }
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setAttachmentError("Only PDF files can be attached.")
        continue
      }
      if (file.type && file.type !== "application/pdf") {
        setAttachmentError("Only PDF files can be attached.")
        continue
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setAttachmentError(`${file.name} exceeds the 10 MB size limit.`)
        continue
      }
      if (next.some((item) => item.file.name === file.name && item.file.size === file.size)) {
        continue
      }
      next.push({ id: `${file.name}-${file.size}-${file.lastModified}`, file })
    }

    setAttachments(next)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments((current) => current.filter((item) => item.id !== id))
    setAttachmentError(null)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipient.trim() || !subject.trim() || !body.trim()) return

    const encodedAttachments: OutboundEmailAttachment[] = await Promise.all(
      attachments.map(async (item) => ({
        filename: item.file.name,
        content_base64: await fileToBase64(item.file),
        mime_type: "application/pdf",
      }))
    )

    await onSend({
      recipient: recipient.trim(),
      subject: subject.trim(),
      body: body.trim(),
      attachments: encodedAttachments.length ? encodedAttachments : undefined,
      ...(pauseSlaTillReply ? { pause_sla_till_reply: true } : {}),
    })
    setInstructions("")
    setSubject("")
    setBody("")
    setPauseSlaTillReply(false)
    setAttachments([])
    setAttachmentError(null)
    setHasDraft(false)
    setRecipient(customerEmail || recipient.trim())
    onSent?.()
  }

  const isGeneratingDraft = isLoadingDraft
  const fieldsDisabled = isSending || isDrafting || isGeneratingDraft
  const preview = getComposePreview(subject, body) || getDraftPreview(initialDraft)

  if (mode === "trigger") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onOpen?.()
          }
        }}
        className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 p-3 hover:bg-muted/30"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Compose reply</p>
          <p className="truncate text-xs text-muted-foreground">
            {isGeneratingDraft
              ? "Generating draft…"
              : preview || "Click to open compose and reply"}
          </p>
        </div>
        <PenLine className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border py-4">
        <p className="min-w-0 flex-1 text-sm text-muted-foreground">
          {isGeneratingDraft
            ? "Generating draft from dispute context…"
            : "AI drafts from dispute context"}
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0"
          disabled={isDrafting || isSending || isGeneratingDraft}
          onClick={handleDraft}
        >
          {isDrafting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          )}
          Regenerate draft
        </Button>
      </div>

      <form
        onSubmit={handleSend}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="shrink-0 space-y-3 py-4">
          <div className="space-y-1">
            <Label htmlFor="compose-instructions" className="text-xs text-muted-foreground">
              Optional instructions for the AI
            </Label>
            <Input
              id="compose-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Ask for bank statement and UTR for INV-2487"
              disabled={fieldsDisabled}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="compose-recipient" className="text-xs text-muted-foreground">
              To
            </Label>
            <Input
              id="compose-recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={fieldsDisabled}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="compose-subject" className="text-xs text-muted-foreground">
              Subject
            </Label>
            <Input
              id="compose-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={fieldsDisabled}
              placeholder={isGeneratingDraft ? "Generating subject…" : undefined}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col border-t border-border py-3">
          <Label htmlFor="compose-body" className="mb-1 shrink-0 text-xs text-muted-foreground">
            Message
          </Label>
          <textarea
            id="compose-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={fieldsDisabled}
            placeholder={isGeneratingDraft ? "Generating message…" : undefined}
            className="min-h-0 w-full flex-1 resize-none overflow-y-auto rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>

        <div className="shrink-0 space-y-3 border-t border-border bg-card py-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-xs text-muted-foreground">Attachments</Label>
              <div>
                <input
                  ref={fileInputRef}
                  id="compose-attachments"
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  className="sr-only"
                  disabled={fieldsDisabled || attachments.length >= MAX_ATTACHMENTS}
                  onChange={(e) => handleAddAttachments(e.target.files)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={fieldsDisabled || attachments.length >= MAX_ATTACHMENTS}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-3.5 w-3.5" aria-hidden />
                  Add PDF
                </Button>
              </div>
            </div>
            {attachmentError && (
              <p className="text-xs text-destructive" role="alert">
                {attachmentError}
              </p>
            )}
            {attachments.length > 0 && (
              <ul className="space-y-1 rounded-md border border-border bg-background px-3 py-2">
                {attachments.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 text-xs text-foreground"
                  >
                    <span className="truncate font-medium">{item.file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1 text-muted-foreground"
                      disabled={fieldsDisabled}
                      onClick={() => handleRemoveAttachment(item.id)}
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {allowPauseSlaTillReply && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-border"
                checked={pauseSlaTillReply}
                onChange={(e) => setPauseSlaTillReply(e.target.checked)}
                disabled={fieldsDisabled}
              />
              <span>Pause SLA until customer replies</span>
            </label>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={fieldsDisabled || !recipient.trim() || !subject.trim() || !body.trim()}
            >
              {isSending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Send className="h-3.5 w-3.5" aria-hidden />
              )}
              Send
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
