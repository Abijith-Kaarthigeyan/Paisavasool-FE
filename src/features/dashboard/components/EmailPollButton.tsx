import React from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { usePollInbox } from "@/features/email-intake/hooks/useEmailReviews"
import { cn } from "@/lib/utils"

export const EmailPollButton: React.FC = () => {
  const { toast } = useToast()
  const pollInbox = usePollInbox()

  const handlePoll = () => {
    pollInbox.mutate(undefined, {
      onSuccess: (result) => {
        const { unread_found, processed, skipped, failed } = result
        if (unread_found === 0) {
          toast({
            title: "Inbox polled",
            description: "No unread emails found.",
          })
          return
        }

        const parts = [`${processed} processed`]
        if (skipped > 0) parts.push(`${skipped} skipped`)
        if (failed > 0) parts.push(`${failed} failed`)

        toast({
          title: "Inbox polled",
          description: `Found ${unread_found} unread — ${parts.join(", ")}.`,
        })
      },
      onError: () => {
        toast({
          title: "Poll failed",
          description: "Could not poll Gmail. Try again in a moment.",
          type: "error",
        })
      },
    })
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="md"
      className="rounded-full px-4"
      onClick={handlePoll}
      disabled={pollInbox.isPending}
      aria-busy={pollInbox.isPending}
    >
      <RefreshCw
        className={cn("mr-1.5 h-4 w-4", pollInbox.isPending && "animate-spin")}
        aria-hidden
      />
      Poll
    </Button>
  )
}

export default EmailPollButton
