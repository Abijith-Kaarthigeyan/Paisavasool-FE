import React from "react"
import { Mail, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEmailPoll } from "../hooks/useEmailPoll"
import { useToast } from "@/components/ui/toast"

export const EmailPollFab: React.FC = () => {
  const { toast } = useToast()
  const pollMutation = useEmailPoll()
  const isPolling = pollMutation.isPending

  const handlePoll = async () => {
    try {
      const result = await pollMutation.mutateAsync()
      toast({
        title: "Email poll complete",
        description: result.message || "Gmail inbox processed successfully.",
        type: "success",
      })
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to poll Gmail inbox."
      toast({
        title: "Email poll failed",
        description: message,
        type: "error",
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handlePoll}
      disabled={isPolling}
      title="Poll Gmail inbox now"
      aria-label="Poll Gmail inbox now"
      aria-busy={isPolling}
      className={cn(
        "fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-popover transition-all",
        "hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70",
        isPolling && "animate-pulse ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
      )}
    >
      {isPolling ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      ) : (
        <Mail className="h-5 w-5" aria-hidden />
      )}
      <span className="text-xs font-medium">
        {isPolling ? "Polling…" : "Poll emails"}
      </span>
    </button>
  )
}

export default EmailPollFab
