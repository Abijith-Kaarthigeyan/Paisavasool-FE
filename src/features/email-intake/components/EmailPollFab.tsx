import React from "react"
import { Mail, Loader2 } from "lucide-react"
import { useEmailPoll } from "../hooks/useEmailPoll"
import { useToast } from "@/components/ui/toast"

export const EmailPollFab: React.FC = () => {
  const { toast } = useToast()
  const pollMutation = useEmailPoll()

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
      disabled={pollMutation.isPending}
      title="Poll Gmail inbox now"
      aria-label="Poll Gmail inbox now"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pollMutation.isPending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Mail className="h-5 w-5" />
      )}
      <span className="text-xs font-bold uppercase tracking-wide">
        {pollMutation.isPending ? "Polling..." : "Poll Emails"}
      </span>
    </button>
  )
}

export default EmailPollFab
