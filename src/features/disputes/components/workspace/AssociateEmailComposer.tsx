import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Send, Loader2 } from "lucide-react"

interface AssociateEmailComposerProps {
  customerEmail: string | null
  isDrafting?: boolean
  isSending?: boolean
  onDraft: (instructions?: string) => Promise<{ recipient: string; subject: string; body: string }>
  onSend: (payload: { recipient: string; subject: string; body: string }) => Promise<void>
}

export function AssociateEmailComposer({
  customerEmail,
  isDrafting,
  isSending,
  onDraft,
  onSend,
}: AssociateEmailComposerProps) {
  const [instructions, setInstructions] = useState("")
  const [recipient, setRecipient] = useState(customerEmail || "")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [hasDraft, setHasDraft] = useState(false)

  useEffect(() => {
    if (customerEmail && !recipient && !hasDraft) {
      setRecipient(customerEmail)
    }
  }, [customerEmail, recipient, hasDraft])

  const handleDraft = async () => {
    const draft = await onDraft(instructions.trim() || undefined)
    setRecipient(draft.recipient || customerEmail || "")
    setSubject(draft.subject)
    setBody(draft.body)
    setHasDraft(true)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipient.trim() || !subject.trim() || !body.trim()) return
    await onSend({ recipient: recipient.trim(), subject: subject.trim(), body: body.trim() })
    setInstructions("")
    setSubject("")
    setBody("")
    setHasDraft(false)
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">Compose reply</p>
          <p className="text-xs text-muted-foreground">
            AI drafts from dispute context — edit before sending.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isDrafting || isSending}
          onClick={handleDraft}
        >
          {isDrafting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          )}
          {hasDraft ? "Regenerate draft" : "Draft with AI"}
        </Button>
      </div>

      <div className="mb-3 space-y-1">
        <Label htmlFor="compose-instructions" className="text-xs text-muted-foreground">
          Optional instructions for the AI
        </Label>
        <Input
          id="compose-instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. Ask for bank statement and UTR for INV-2487"
          disabled={isDrafting || isSending}
        />
      </div>

      {(hasDraft || subject || body) && (
        <form onSubmit={handleSend} className="space-y-3 border-t border-border pt-3">
          <div className="space-y-1">
            <Label htmlFor="compose-recipient" className="text-xs text-muted-foreground">
              To
            </Label>
            <Input
              id="compose-recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={isSending}
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
              disabled={isSending}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="compose-body" className="text-xs text-muted-foreground">
              Message
            </Label>
            <textarea
              id="compose-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isSending}
              rows={8}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isSending || !recipient.trim() || !subject.trim() || !body.trim()}
            >
              {isSending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Send className="h-3.5 w-3.5" aria-hidden />
              )}
              Send to customer
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
