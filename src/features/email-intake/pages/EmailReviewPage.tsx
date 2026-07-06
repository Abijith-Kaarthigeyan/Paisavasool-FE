import React, { useState } from "react"
import {
  useEmailManualReview,
  useConfirmEmailAction,
} from "../hooks/useEmailReviews"
import type { EmailIntakeItem, EmailManualAction } from "../types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { getDashboardPath } from "@/lib/navigation"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { ConfidenceMeter } from "@/components/ui/confidence-meter"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/toast"
import { getConfidenceBadgeVariant, getStatusVariant } from "@/lib/design-tokens"
import { cn } from "@/lib/utils"
import { CheckCircle, HelpCircle, Mail, RefreshCw } from "lucide-react"

const sectionCard = "rounded-lg border border-border bg-card shadow-card"
const sectionLabel = "text-xs font-semibold uppercase tracking-wide text-muted-foreground"

const EMAIL_CLASSIFICATION_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  PAYMENT: "success",
  DISPUTE: "warning",
  OTHER: "neutral",
}

type ConfirmAction = EmailManualAction

const CONFIRM_MESSAGES: Record<ConfirmAction, string> = {
  ROUTE_PAYMENT: "Route this email to the payment upload pipeline?",
  ROUTE_DISPUTE: "Create a dispute case from this email?",
  DISMISS: "Dismiss this email? It will be removed from the review queue.",
}

const SUCCESS_MESSAGES: Record<ConfirmAction, string> = {
  ROUTE_PAYMENT: "Email routed to the payment upload pipeline.",
  ROUTE_DISPUTE: "Dispute case created from this email.",
  DISMISS: "Email dismissed and removed from the review queue.",
}

export const EmailReviewPage: React.FC = () => {
  const { toast } = useToast()
  const [selectedEmail, setSelectedEmail] = useState<EmailIntakeItem | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const { data: emails = [], isLoading, isError, refetch, isFetching } =
    useEmailManualReview()
  const confirmMutation = useConfirmEmailAction()

  const handleRowClick = (email: EmailIntakeItem) => {
    setSelectedEmail(email)
    setIsDrawerOpen(true)
  }

  const handleActionConfirm = () => {
    if (!selectedEmail || !confirmAction) return
    setIsConfirmOpen(false)

    confirmMutation.mutate(
      { id: selectedEmail.id, body: { action: confirmAction } },
      {
        onSuccess: (result) => {
          let description = SUCCESS_MESSAGES[confirmAction]
          if (confirmAction === "ROUTE_PAYMENT" && result.payment_upload_id) {
            description += ` View at /payment-upload/${result.payment_upload_id}`
          } else if (confirmAction === "ROUTE_DISPUTE" && result.dispute_case_id) {
            description += ` View at /disputes/cases/${result.dispute_case_id}`
          }

          toast({
            title: "Action confirmed",
            description,
            type: "success",
          })
          setIsDrawerOpen(false)
          setSelectedEmail(null)
        },
        onError: (err: unknown) => {
          const detail = (err as { response?: { data?: { detail?: string } } }).response
            ?.data?.detail
          toast({
            title: "Action failed",
            description: detail || "Failed to process email review action.",
            type: "error",
          })
        },
      }
    )
  }

  const openConfirm = (action: ConfirmAction) => {
    setConfirmAction(action)
    setIsConfirmOpen(true)
  }

  return (
    <div className="space-y-8">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", to: getDashboardPath() },
          { label: "Email review" },
        ]}
      />

      <PageHeader
        title="Email review"
        description="Review and route emails that need manual attention"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
              aria-hidden
            />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={6} columns={5} />
            </div>
          ) : isError ? (
            <EmptyState
              icon={<HelpCircle className="h-6 w-6 text-destructive" />}
              title="Failed to load email review queue"
              description="Verify the AR service is active and try again."
              action={
                <Button variant="secondary" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : emails.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="h-6 w-6 text-success" />}
              title="No emails need review"
              description="All incoming emails have been routed automatically."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map((email) => (
                  <TableRow
                    key={email.id}
                    className={cn(
                      "cursor-pointer",
                      selectedEmail?.id === email.id && "bg-primary/5"
                    )}
                    onClick={() => handleRowClick(email)}
                  >
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {email.customer_email}
                    </TableCell>
                    <TableCell
                      className="max-w-[280px] truncate text-muted-foreground"
                      title={email.email_subject ?? undefined}
                    >
                      {email.email_subject || "(No subject)"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(
                          EMAIL_CLASSIFICATION_VARIANT,
                          email.classification ?? undefined,
                          "neutral"
                        )}
                        shape="pill"
                      >
                        {email.classification || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[140px]">
                      {email.confidence != null ? (
                        <ConfidenceMeter value={email.confidence} size="sm" showValue />
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {new Date(email.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="flex h-full flex-col overflow-hidden pb-0">
          <SheetHeader className="shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" aria-hidden />
              Email review
            </SheetTitle>
            <SheetDescription>
              Review the email content and choose how to route it.
            </SheetDescription>
          </SheetHeader>

          {selectedEmail && (
            <div className="min-h-0 flex-1 space-y-5 overflow-hidden py-4 hover-scroll-y">
              <div className={cn(sectionCard, "space-y-3 p-4")}>
                <div>
                  <span className={sectionLabel}>From</span>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {selectedEmail.customer_email}
                  </p>
                </div>
                <div>
                  <span className={sectionLabel}>Subject</span>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {selectedEmail.email_subject || "(No subject)"}
                  </p>
                </div>
              </div>

              <div>
                <span className={cn(sectionLabel, "mb-2 block")}>Message body</span>
                <div className="whitespace-pre-wrap rounded-lg border border-border bg-card p-5 text-sm leading-relaxed text-foreground">
                  {selectedEmail.email_body ||
                    selectedEmail.raw_content ||
                    "(No message body parsed)"}
                </div>
              </div>

              <div className={cn(sectionCard, "space-y-3 p-4")}>
                <span className={sectionLabel}>AI classification</span>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    variant={getStatusVariant(
                      EMAIL_CLASSIFICATION_VARIANT,
                      selectedEmail.classification ?? undefined,
                      "neutral"
                    )}
                    shape="pill"
                  >
                    {selectedEmail.classification || "Unknown"}
                  </Badge>
                  {selectedEmail.confidence != null && (
                    <Badge
                      variant={getConfidenceBadgeVariant(selectedEmail.confidence)}
                      shape="pill"
                      className="tabular-nums"
                    >
                      {selectedEmail.confidence.toFixed(1)}%
                    </Badge>
                  )}
                </div>
                {selectedEmail.confidence != null && (
                  <ConfidenceMeter
                    value={selectedEmail.confidence}
                    label="Classification confidence"
                    size="md"
                  />
                )}
              </div>

              {selectedEmail.reasoning && selectedEmail.reasoning.length > 0 && (
                <div className={cn(sectionCard, "space-y-3 p-4")}>
                  <span className={sectionLabel}>Reasoning</span>
                  <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                    {selectedEmail.reasoning.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <SheetFooter className="mt-0 shrink-0 border-t border-border bg-card/95 px-0 py-4 backdrop-blur-sm">
            {selectedEmail && (
              <div className="flex w-full flex-wrap justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="border-destructive/25 text-destructive hover:border-destructive/40 hover:bg-destructive/5"
                  onClick={() => openConfirm("DISMISS")}
                  disabled={confirmMutation.isPending}
                >
                  Dismiss
                </Button>
                <Button
                  type="button"
                  variant="success"
                  size="sm"
                  onClick={() => openConfirm("ROUTE_PAYMENT")}
                  disabled={confirmMutation.isPending}
                >
                  Route as Payment
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => openConfirm("ROUTE_DISPUTE")}
                  disabled={confirmMutation.isPending}
                >
                  Route as Dispute
                </Button>
              </div>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
            <DialogDescription>
              {confirmAction ? CONFIRM_MESSAGES[confirmAction] : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={
                confirmAction === "DISMISS"
                  ? "danger"
                  : confirmAction === "ROUTE_PAYMENT"
                    ? "success"
                    : "primary"
              }
              size="sm"
              onClick={handleActionConfirm}
              disabled={confirmMutation.isPending}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EmailReviewPage
