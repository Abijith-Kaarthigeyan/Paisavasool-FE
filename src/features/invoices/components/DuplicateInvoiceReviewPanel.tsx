import React, { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, CheckCircle, Pencil, XCircle } from "lucide-react"
import { InvoiceAmendmentDiff } from "./InvoiceAmendmentDiff"
import {
  EditableRecommendedInvoiceForm,
  type EditableInvoiceData,
} from "@/features/disputes/components/EditableRecommendedInvoiceForm"
import {
  useDuplicateReviewContext,
  useDuplicateReviewMutations,
} from "../hooks/useInvoices"
import type { ReviewQueueItem } from "../types"

type DecisionKind = "approve" | "reject" | "edit_apply"

interface DuplicateInvoiceReviewPanelProps {
  item: ReviewQueueItem
  batchId: string
  fileName?: string
}

export const DuplicateInvoiceReviewPanel: React.FC<DuplicateInvoiceReviewPanelProps> = ({
  item,
  batchId,
  fileName,
}) => {
  const { data: context, isLoading, error } = useDuplicateReviewContext(
    item.status === "PENDING" ? item.id : undefined
  )
  const { approve, editAndApply, reject } = useDuplicateReviewMutations(batchId)

  const [notes, setNotes] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editedInvoice, setEditedInvoice] = useState<EditableInvoiceData | null>(null)
  const [pendingDecision, setPendingDecision] = useState<DecisionKind | null>(null)

  const isSubmitting =
    approve.isPending || editAndApply.isPending || reject.isPending

  const proposedForEdit = useMemo(() => {
    if (!context) return {}
    return {
      ...context.proposed_invoice,
      invoice_items: context.proposed_invoice.items,
    }
  }, [context])

  const handleConfirm = async () => {
    if (!pendingDecision || !context) return

    try {
      if (pendingDecision === "approve") {
        await approve.mutateAsync({ reviewId: item.id, notes: notes || undefined })
      } else if (pendingDecision === "reject") {
        await reject.mutateAsync({ reviewId: item.id, notes: notes || undefined })
      } else if (pendingDecision === "edit_apply" && editedInvoice) {
        await editAndApply.mutateAsync({
          reviewId: item.id,
          amendedInvoiceJson: {
            ...editedInvoice,
            items: editedInvoice.items,
            invoice_items: editedInvoice.items,
          },
          notes: notes || undefined,
        })
        setIsEditing(false)
      }
      setPendingDecision(null)
      setNotes("")
    } catch {
      // Errors surface via mutation state / API client
    }
  }

  if (item.status !== "PENDING") {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {fileName || "Duplicate invoice"}
          </CardTitle>
          <CardDescription>
            Review {item.status === "RESOLVED" ? "completed — invoice amended" : "rejected"}.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Loading duplicate comparison…
        </CardContent>
      </Card>
    )
  }

  if (error || !context) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-6 text-sm text-destructive">
          Could not load duplicate review context.
        </CardContent>
      </Card>
    )
  }

  const canApprove = context.has_changes

  return (
    <>
      <Card className="border-warning/30">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
                {fileName || context.invoice_number}
              </CardTitle>
              <CardDescription>
                Duplicate of {context.invoice_number} — comparing upload against version{" "}
                {context.current_version}.
              </CardDescription>
            </div>
            <Badge variant="warning" shape="pill">
              Pending review
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {!context.has_changes && (
            <div className="rounded-lg border border-warning/30 bg-warning-muted/30 p-4 text-sm text-foreground">
              No changes detected — this appears to be a true duplicate. Reject the upload
              to discard it.
            </div>
          )}

          <InvoiceAmendmentDiff
            currentInvoice={context.current_invoice}
            proposedInvoice={context.proposed_invoice}
            editedInvoice={isEditing ? editedInvoice : null}
            emptyMessage="No invoice changes detected between the upload and the current version."
          />

          {isEditing && (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">Edit before applying</p>
              <EditableRecommendedInvoiceForm
                initialInvoice={proposedForEdit}
                onChange={setEditedInvoice}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`notes-${item.id}`}>Notes (optional)</Label>
            <textarea
              id={`notes-${item.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context for this decision…"
              rows={2}
              className="flex min-h-[60px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="success"
              size="sm"
              disabled={!canApprove || isSubmitting || isEditing}
              onClick={() => setPendingDecision("approve")}
            >
              <CheckCircle className="h-4 w-4" aria-hidden />
              Approve amendment
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!canApprove || isSubmitting}
              onClick={() => {
                setIsEditing((prev) => !prev)
                if (!isEditing) {
                  setEditedInvoice(null)
                }
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              {isEditing ? "Cancel edit" : "Edit & apply"}
            </Button>
            {isEditing && (
              <Button
                variant="primary"
                size="sm"
                disabled={!editedInvoice || isSubmitting}
                onClick={() => setPendingDecision("edit_apply")}
              >
                Apply edited invoice
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setPendingDecision("reject")}
            >
              <XCircle className="h-4 w-4" aria-hidden />
              Reject upload
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={pendingDecision != null}
        onOpenChange={(open) => !open && setPendingDecision(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingDecision === "approve" && "Confirm amendment"}
              {pendingDecision === "reject" && "Confirm rejection"}
              {pendingDecision === "edit_apply" && "Apply edited invoice"}
            </DialogTitle>
            <DialogDescription>
              {pendingDecision === "approve" &&
                "The existing invoice will be amended and a new version will be created across the system."}
              {pendingDecision === "reject" &&
                "The duplicate upload will be discarded without changing the existing invoice."}
              {pendingDecision === "edit_apply" &&
                "Your edited invoice data will amend the existing invoice as a new version."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingDecision(null)}>
              Cancel
            </Button>
            <Button
              variant={pendingDecision === "reject" ? "danger" : "success"}
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
