import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type DisputeDecisionKind =
  | "approve"
  | "reject"
  | "settlement_done"
  | "settlement_not_done"
  | "acknowledge"
  | "operational_reject"
  | "edit_apply"
  | "escalate"

interface DisputeDecisionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  decision: DisputeDecisionKind | null
  onConfirm: () => void
  isSubmitting?: boolean
}

const decisionCopy: Record<
  DisputeDecisionKind,
  { title: string; description: string; confirmLabel: string; variant: "success" | "danger" | "primary" }
> = {
  approve: {
    title: "Confirm approval",
    description:
      "You are approving the AI recommendation. This will resume workflow execution with the proposed resolution.",
    confirmLabel: "Confirm approval",
    variant: "success",
  },
  reject: {
    title: "Confirm rejection",
    description:
      "You are rejecting the AI recommendation. The dispute will be rerouted for further review.",
    confirmLabel: "Confirm rejection",
    variant: "danger",
  },
  settlement_done: {
    title: "Confirm settlement",
    description:
      "You are confirming that payment settlement is complete. This will close the payment review step.",
    confirmLabel: "Confirm settlement",
    variant: "success",
  },
  settlement_not_done: {
    title: "Settlement not confirmed",
    description:
      "You are indicating that settlement is not complete. The dispute will remain open for follow-up.",
    confirmLabel: "Confirm not settled",
    variant: "danger",
  },
  acknowledge: {
    title: "Acknowledge request",
    description:
      "You are acknowledging the internal team request. Workflow execution will resume after confirmation.",
    confirmLabel: "Confirm acknowledgement",
    variant: "success",
  },
  operational_reject: {
    title: "Reject request",
    description:
      "You are rejecting the internal team request. The dispute will be rerouted for further action.",
    confirmLabel: "Confirm rejection",
    variant: "danger",
  },
  edit_apply: {
    title: "Apply edited amendment",
    description:
      "You are submitting your edited invoice changes. These will replace the AI recommendation before application.",
    confirmLabel: "Apply changes",
    variant: "primary",
  },
  escalate: {
    title: "Confirm escalation",
    description:
      "You are manually escalating this dispute to your manager. The dispute status will change to Escalated and the manager will handle its resolution.",
    confirmLabel: "Confirm escalation",
    variant: "danger",
  },
}

export function DisputeDecisionDialog({
  open,
  onOpenChange,
  decision,
  onConfirm,
  isSubmitting,
}: DisputeDecisionDialogProps) {
  if (!decision) return null

  const copy = decisionCopy[decision]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={copy.variant}
            size="sm"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {copy.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
