import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type DisputeCloseOutcome = "CUSTOMER_CORRECT" | "COMPANY_CORRECT"

interface DisputeCloseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hasPendingAction?: boolean
  onConfirm: (payload: { resolution_outcome: DisputeCloseOutcome; comments: string }) => void
  isSubmitting?: boolean
}

const outcomeOptions: Array<{
  value: DisputeCloseOutcome
  label: string
  description: string
}> = [
  {
    value: "CUSTOMER_CORRECT",
    label: "Customer is correct",
    description: "The dispute is valid and the company will adjust or credit as needed.",
  },
  {
    value: "COMPANY_CORRECT",
    label: "Company is correct",
    description: "The invoice and charges stand; no adjustment is required.",
  },
]

export function DisputeCloseDialog({
  open,
  onOpenChange,
  hasPendingAction = false,
  onConfirm,
  isSubmitting,
}: DisputeCloseDialogProps) {
  const [outcome, setOutcome] = useState<DisputeCloseOutcome>("CUSTOMER_CORRECT")
  const [comments, setComments] = useState("")

  useEffect(() => {
    if (!open) {
      setOutcome("CUSTOMER_CORRECT")
      setComments("")
    }
  }, [open])

  const canSubmit = comments.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onConfirm({
      resolution_outcome: outcome,
      comments: comments.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" aria-hidden />
            Close dispute
          </DialogTitle>
          <DialogDescription>
            Manually close this dispute after resolving it offline (for example, by phone).
            No automated closing email will be sent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasPendingAction && (
            <p className="rounded-md border border-warning/50 bg-warning-muted/10 px-3 py-2 text-sm text-warning">
              This will close the dispute without completing the pending workflow step.
            </p>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">Resolution outcome</legend>
            {outcomeOptions.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-md border p-3 transition-colors",
                  outcome === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
              >
                <input
                  type="radio"
                  name="dispute-close-outcome"
                  value={option.value}
                  checked={outcome === option.value}
                  onChange={() => setOutcome(option.value)}
                  className="mt-1"
                />
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium text-foreground">
                    {option.label}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="close-dispute-notes">Resolution notes</Label>
            <textarea
              id="close-dispute-notes"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Describe how the dispute was resolved (required for audit)…"
              className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            loading={isSubmitting}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Close dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
