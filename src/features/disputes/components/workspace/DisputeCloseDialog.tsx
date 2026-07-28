import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type {
  DisputeCloseOutcome,
  DisputeClosePayload,
  DisputeResolutionMethod,
} from "../../types"

interface DisputeCloseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: DisputeClosePayload) => void
  isSubmitting?: boolean
}

const methodOptions: Array<{
  value: DisputeResolutionMethod
  label: string
}> = [
  { value: "PHONE", label: "Phone call" },
  { value: "IN_PERSON", label: "In-person discussion" },
  { value: "EMAIL", label: "Email conversation" },
  {
    value: "OTHER",
    label: "Any other mutual agreement reached outside paisavasool",
  },
]

const outcomeOptions: Array<{
  value: DisputeCloseOutcome
  label: string
}> = [
  { value: "CUSTOMER_CORRECT", label: "Customer correct" },
  { value: "COMPANY_CORRECT", label: "Company correct" },
]

function getMethodLabel(value: DisputeResolutionMethod): string {
  return methodOptions.find((o) => o.value === value)?.label ?? value
}

function getOutcomeLabel(value: DisputeCloseOutcome): string {
  return outcomeOptions.find((o) => o.value === value)?.label ?? value
}

export function DisputeCloseDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: DisputeCloseDialogProps) {
  const [step, setStep] = useState<"form" | "review">("form")
  const [resolutionMethod, setResolutionMethod] = useState<DisputeResolutionMethod | null>(null)
  const [outcome, setOutcome] = useState<DisputeCloseOutcome>("CUSTOMER_CORRECT")
  const [comments, setComments] = useState("")

  useEffect(() => {
    if (!open) {
      setStep("form")
      setResolutionMethod(null)
      setOutcome("CUSTOMER_CORRECT")
      setComments("")
    }
  }, [open])

  const canConfirm =
    resolutionMethod !== null && outcome !== null && comments.trim().length > 0

  const handleConfirm = () => {
    if (!canConfirm || !resolutionMethod) return
    setStep("review")
  }

  const handleSubmit = () => {
    if (!canConfirm || !resolutionMethod) return
    onConfirm({
      resolution_method: resolutionMethod,
      resolution_outcome: outcome,
      comments: comments.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg font-sans">
        <DialogHeader>
          <DialogTitle className="text-foreground">Close dispute</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Step {step === "form" ? "1" : "2"} of 2
          </p>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">
                How did you solve the dispute?
              </legend>
              {methodOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors",
                    resolutionMethod === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <input
                    type="radio"
                    name="dispute-close-method"
                    value={option.value}
                    checked={resolutionMethod === option.value}
                    onChange={() => setResolutionMethod(option.value)}
                    className="mt-0.5"
                  />
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                </label>
              ))}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">
                What was the resolution?
              </legend>
              {outcomeOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors",
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
                    className="mt-0.5"
                  />
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                </label>
              ))}
            </fieldset>

            <div className="space-y-1.5">
              <Label htmlFor="close-dispute-notes">Resolution notes</Label>
              <textarea
                id="close-dispute-notes"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Describe how the dispute was resolved…"
                className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                How solved
              </p>
              <p className="mt-1 font-medium text-foreground">
                {resolutionMethod ? getMethodLabel(resolutionMethod) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Resolution
              </p>
              <p className="mt-1 font-medium text-foreground">{getOutcomeLabel(outcome)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-wrap text-foreground">{comments.trim()}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "form" ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setStep("form")}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={isSubmitting}
                disabled={!canConfirm}
                onClick={handleSubmit}
              >
                Close dispute
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
