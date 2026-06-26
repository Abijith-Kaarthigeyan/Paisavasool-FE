import React, { useState, useEffect } from "react"
import { usePaymentReviews, usePaymentDetails, useApproveReview, useRejectReview } from "../hooks/useReviews"
import { useInvoices } from "@/features/invoices/hooks/useInvoices"
import { useQuery } from "@tanstack/react-query"
import { customerService } from "@/features/customers/services/customerService"
import { useCustomerDetail } from "@/features/customers/hooks/useCustomers"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ConfidenceMeter } from "@/components/ui/confidence-meter"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/toast"
import {
  MATCHING_REVIEW_STATUS_VARIANT,
  getStatusVariant,
  getConfidenceBadgeVariant,
} from "@/lib/design-tokens"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/formatCurrency"
import { AlertTriangle, CheckCircle, HelpCircle } from "lucide-react"

export const ReviewQueuePage: React.FC = () => {
  const { toast } = useToast()
  const [selectedReview, setSelectedReview] = useState<any | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const { data: reviews = [], isLoading, isError } = usePaymentReviews()

  const approveMutation = useApproveReview()
  const rejectMutation = useRejectReview()

  const handleRowClick = (reviewItem: any) => {
    setSelectedReview(reviewItem)
    setIsDrawerOpen(true)
  }

  const handleActionConfirm = () => {
    if (!selectedReview) return
    setIsConfirmOpen(false)

    if (confirmAction === "approve") {
      const resolvedCustId = selectedCustomerId

      const payload = {
        resolved_customer_id: resolvedCustId && resolvedCustId !== "" ? resolvedCustId : null,
        explicit_allocations: selectedAllocations.map((a) => ({
          invoice_id: a.invoice_id,
          amount: parseFloat(a.amount.toString()),
        })),
      }

      approveMutation.mutate(
        { id: selectedReview.id, data: payload },
        {
          onSuccess: () => {
            toast({
              title: "Review approved",
              description: "Payment match resolved and settled successfully.",
              type: "success",
            })
            setIsDrawerOpen(false)
            resetAllocations()
          },
          onError: (err: unknown) => {
            const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            toast({
              title: "Approval failed",
              description: detail || "Failed to approve payment match.",
              type: "error",
            })
          },
        }
      )
    } else if (confirmAction === "reject") {
      rejectMutation.mutate(selectedReview.id, {
        onSuccess: () => {
          toast({
            title: "Review rejected",
            description: "Payment match has been rejected. Upload marked as FAILED.",
            type: "success",
          })
          setIsDrawerOpen(false)
          resetAllocations()
        },
        onError: (err: unknown) => {
          const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          toast({
            title: "Rejection failed",
            description: detail || "Failed to reject payment match.",
            type: "error",
          })
        },
      })
    }
  }

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [customerCodeInput, setCustomerCodeInput] = useState<string>("")
  const [selectedAllocations, setSelectedAllocations] = useState<
    Array<{ invoice_id: string; invoice_number: string; amount: number }>
  >([])
  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({})

  const resetAllocations = () => {
    setSelectedCustomerId("")
    setCustomerCodeInput("")
    setSelectedAllocations([])
    setAllocationInputs({})
  }

  const handleCustomerCodeChange = (val: string) => {
    setCustomerCodeInput(val)
    setSelectedAllocations([])
    setAllocationInputs({})
  }

  const { data: paymentDetails, isLoading: isPaymentLoading } = usePaymentDetails(
    selectedReview?.payment_id
  )

  const { data: matchedCustomerDetail } = useCustomerDetail(
    paymentDetails?.customer_id || undefined
  )

  useEffect(() => {
    if (paymentDetails?.customer_id) {
      setSelectedCustomerId(paymentDetails.customer_id)
      if (matchedCustomerDetail?.customer?.customer_code) {
        setCustomerCodeInput(matchedCustomerDetail.customer.customer_code)
      }
    } else {
      setSelectedCustomerId("")
      setCustomerCodeInput("")
    }
  }, [paymentDetails, matchedCustomerDetail])

  const trimmedCode = customerCodeInput.trim()
  const { data: searchedCustomers, isFetching: isSearchingCustomer } = useQuery({
    queryKey: ["customers", { customer_code: trimmedCode }],
    queryFn: () => customerService.getCustomers({ customer_code: trimmedCode }),
    enabled: trimmedCode.length >= 3,
  })

  const resolvedCustomer = searchedCustomers?.find(
    (c) => c.customer_code.toLowerCase() === trimmedCode.toLowerCase()
  )

  useEffect(() => {
    if (resolvedCustomer) {
      setSelectedCustomerId(resolvedCustomer.id)
    } else {
      if (
        matchedCustomerDetail?.customer?.customer_code.toLowerCase() ===
        trimmedCode.toLowerCase()
      ) {
        setSelectedCustomerId(paymentDetails?.customer_id || "")
      } else {
        setSelectedCustomerId("")
      }
    }
  }, [resolvedCustomer, trimmedCode, matchedCustomerDetail, paymentDetails])

  const { data: customerInvoices = [], isLoading: isCustomerInvoicesLoading } = useInvoices(
    selectedCustomerId ? { customer_id: selectedCustomerId } : undefined
  )

  const allocatableInvoices = customerInvoices.filter(
    (inv) =>
      (inv.status === "PENDING" ||
        inv.status === "PARTIALLY_PAID" ||
        inv.status === "OVERDUE" ||
        inv.status === "DISPUTED") &&
      inv.outstanding_amount > 0
  )

  const totalAllocated = selectedAllocations.reduce((sum, a) => sum + a.amount, 0)
  const remainingToAllocate = paymentDetails
    ? paymentDetails.payment_amount - totalAllocated
    : 0

  const handleCheckboxToggle = (invoice: {
    id: string
    invoice_number: string
    outstanding_amount: number
  }) => {
    const exists = selectedAllocations.some((a) => a.invoice_id === invoice.id)
    if (exists) {
      setSelectedAllocations((prev) => prev.filter((a) => a.invoice_id !== invoice.id))
      const inputs = { ...allocationInputs }
      delete inputs[invoice.id]
      setAllocationInputs(inputs)
    } else {
      const defaultAlloc = Math.min(
        invoice.outstanding_amount,
        remainingToAllocate > 0 ? remainingToAllocate : 0
      )
      setSelectedAllocations((prev) => [
        ...prev,
        {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          amount: defaultAlloc,
        },
      ])
      setAllocationInputs((prev) => ({ ...prev, [invoice.id]: defaultAlloc.toString() }))
    }
  }

  const handleAmountChange = (invoiceId: string, value: string) => {
    setAllocationInputs((prev) => ({ ...prev, [invoiceId]: value }))
    const numeric = parseFloat(value) || 0

    setSelectedAllocations((prev) =>
      prev.map((a) => (a.invoice_id === invoiceId ? { ...a, amount: numeric } : a))
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payment matching reviews"
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
              title="Failed to load review queue"
              description="Verify the AR service microservice is active and responsive."
            />
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="h-6 w-6 text-success" />}
              title="Review queue is empty"
              description="All payment matches have been resolved automatically."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment receipt</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Review reason</TableHead>
                  <TableHead>Uploaded at</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((rev) => (
                  <TableRow
                    key={rev.id}
                    className={cn(
                      "cursor-pointer",
                      selectedReview?.id === rev.id && "bg-primary/5"
                    )}
                    onClick={() => handleRowClick(rev)}
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      Wire transfer
                    </TableCell>
                    <TableCell className="min-w-[160px]">
                      <ConfidenceMeter value={rev.confidence} size="sm" showValue />
                      {rev.suggested_customer_name && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Suggested: {rev.suggested_customer_name} ({rev.suggested_customer_code})
                        </p>
                      )}
                    </TableCell>
                    <TableCell
                      className="max-w-[320px] truncate text-muted-foreground"
                      title={rev.review_reason}
                    >
                      {rev.review_reason}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={getStatusVariant(MATCHING_REVIEW_STATUS_VARIANT, rev.status)}
                        shape="pill"
                      >
                        {rev.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="overflow-y-auto pb-10">
          <SheetHeader>
            <SheetTitle>Payment match resolution</SheetTitle>
            <SheetDescription>Verify bank wire metadata and allocate cash amounts.</SheetDescription>
          </SheetHeader>

          {isPaymentLoading ? (
            <div className="space-y-4 py-6">
              <TableSkeleton rows={2} columns={1} />
            </div>
          ) : paymentDetails ? (
            <div className="space-y-6 pt-4 text-sm">
              {selectedReview?.confidence !== undefined && (
                <ConfidenceMeter
                  value={selectedReview.confidence}
                  label="Match confidence"
                  size="md"
                />
              )}

              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">
                    Original customer extracted
                  </span>
                  <span className="mt-0.5 font-medium text-foreground">
                    {paymentDetails.customer_name_original}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">Payment amount</span>
                  <span className="mt-0.5 text-base font-semibold tabular-nums text-primary">
                    {formatCurrency(paymentDetails.payment_amount)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">Payment date</span>
                  <span className="mt-0.5 font-medium text-foreground">
                    {new Date(paymentDetails.payment_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {selectedReview?.suggested_candidates &&
              selectedReview.suggested_candidates.length > 0 ? (
                <div className="space-y-2">
                  <span className="block text-xs font-medium text-muted-foreground">
                    Match suggestions (top candidates)
                  </span>
                  <div className="max-h-[280px] space-y-2.5 overflow-y-auto pr-1">
                    {selectedReview.suggested_candidates.map((cand: {
                      customer_id: string
                      customer_name: string
                      customer_code: string
                      confidence: number
                    }) => {
                      const isSelected = selectedCustomerId === cand.customer_id
                      return (
                        <div
                          key={cand.customer_id}
                          className={cn(
                            "flex flex-col gap-2 rounded-lg border p-3.5 transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:bg-muted/40"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div>
                              <p className="font-medium text-foreground">{cand.customer_name}</p>
                              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                {cand.customer_code}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Badge
                                variant={getConfidenceBadgeVariant(cand.confidence)}
                                shape="pill"
                              >
                                {cand.confidence.toFixed(1)}%
                              </Badge>
                              {isSelected ? (
                                <span className="text-xs font-medium text-success">Selected</span>
                              ) : (
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCustomerId(cand.customer_id)
                                    setCustomerCodeInput(cand.customer_code)
                                  }}
                                >
                                  Use suggestion
                                </Button>
                              )}
                            </div>
                          </div>
                          <ConfidenceMeter value={cand.confidence} size="sm" showValue={false} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                selectedReview?.suggested_customer_name && (
                  <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary">Top match candidate</span>
                      <Badge
                        variant={getConfidenceBadgeVariant(selectedReview.confidence)}
                        shape="pill"
                      >
                        {selectedReview.confidence.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-medium text-foreground">
                          {selectedReview.suggested_customer_name}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {selectedReview.suggested_customer_code}
                        </p>
                      </div>
                      {selectedCustomerId !== selectedReview.suggested_customer_id ? (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomerId(selectedReview.suggested_customer_id)
                            setCustomerCodeInput(selectedReview.suggested_customer_code)
                          }}
                        >
                          Use suggestion
                        </Button>
                      ) : (
                        <span className="text-xs font-medium text-success">Selected</span>
                      )}
                    </div>
                  </div>
                )
              )}

              <div className="space-y-2">
                <Label htmlFor="customer-code">Resolved customer code</Label>
                <div className="relative">
                  <Input
                    id="customer-code"
                    value={customerCodeInput}
                    onChange={(e) => handleCustomerCodeChange(e.target.value)}
                    placeholder="Enter customer code (e.g. CUST-000001)…"
                    className="font-mono uppercase"
                  />
                  {isSearchingCustomer && (
                    <div className="absolute right-3 top-2.5">
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary" />
                    </div>
                  )}
                </div>
                {selectedCustomerId ? (
                  <p className="text-xs font-medium text-success">
                    Customer resolved:{" "}
                    {resolvedCustomer?.customer_name ||
                      matchedCustomerDetail?.customer?.customer_name}
                  </p>
                ) : customerCodeInput.trim().length >= 3 ? (
                  <p className="text-xs font-medium text-destructive">
                    No active customer found with code &ldquo;{customerCodeInput}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Enter customer code to query candidate invoices.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <Label>Candidate invoices allocation</Label>
                  {selectedCustomerId && (
                    <Badge
                      variant={allocatableInvoices.length > 0 ? "outline" : "destructive"}
                      shape="pill"
                    >
                      {allocatableInvoices.length} candidate invoices
                    </Badge>
                  )}
                </div>

                {isCustomerInvoicesLoading ? (
                  <TableSkeleton rows={2} columns={1} />
                ) : !selectedCustomerId ? (
                  <EmptyState
                    title="Select a customer"
                    description="Set a customer reference to view open matching candidates."
                    className="py-6"
                  />
                ) : allocatableInvoices.length === 0 ? (
                  <EmptyState
                    title="No open invoices"
                    description="No open or disputed invoices found for this customer in the billing registry."
                    className="py-6"
                  />
                ) : (
                  <div className="max-h-[250px] space-y-3 overflow-y-auto pr-1">
                    {allocatableInvoices.map((inv) => {
                      const isChecked = selectedAllocations.some((a) => a.invoice_id === inv.id)
                      return (
                        <div
                          key={inv.id}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-3 transition-colors",
                            isChecked
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:bg-muted/40"
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCheckboxToggle(inv)}
                              className="h-4 w-4 rounded border-input text-primary focus:ring-ring/30"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground">
                                  {inv.invoice_number}
                                </p>
                                {inv.status === "DISPUTED" && (
                                  <Badge variant="warning" shape="pill">
                                    Disputed
                                  </Badge>
                                )}
                                {inv.status === "OVERDUE" && (
                                  <Badge variant="destructive" shape="pill">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                                Outstanding: {formatCurrency(inv.outstanding_amount)}
                              </p>
                            </div>
                          </div>

                          {isChecked && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground">₹</span>
                              <Input
                                type="number"
                                step="any"
                                value={allocationInputs[inv.id] || ""}
                                onChange={(e) => handleAmountChange(inv.id, e.target.value)}
                                className="w-24 text-right font-mono tabular-nums"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2.5 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total cash allocating</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {formatCurrency(totalAllocated)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining unallocated</span>
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      remainingToAllocate < -0.01 ? "text-destructive" : "text-success"
                    )}
                  >
                    {formatCurrency(remainingToAllocate)}
                  </span>
                </div>

                {remainingToAllocate > 0.01 && (
                  <div className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning-muted p-3 text-xs text-warning-foreground">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      <strong>Under-allocation:</strong> Remaining balance of{" "}
                      {formatCurrency(remainingToAllocate)} will generate a customer credit upon
                      approval.
                    </span>
                  </div>
                )}

                {remainingToAllocate < -0.01 && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      <strong>Error:</strong> Allocated amount exceeds total cash receipt. Please
                      correct invoice allocations.
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <SheetFooter>
            {selectedReview?.status === "PENDING" && (
              <div className="flex w-full justify-end gap-3">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setConfirmAction("reject")
                    setIsConfirmOpen(true)
                  }}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                >
                  Reject match
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setConfirmAction("approve")
                    setIsConfirmOpen(true)
                  }}
                  disabled={
                    rejectMutation.isPending ||
                    approveMutation.isPending ||
                    remainingToAllocate < -0.01 ||
                    !selectedCustomerId
                  }
                >
                  Approve allocation
                </Button>
              </div>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm review settlement</DialogTitle>
            <DialogDescription>
              {confirmAction === "approve"
                ? `Confirm cash settlement for this customer. Allocations total is ${formatCurrency(totalAllocated)}.`
                : "Are you sure you want to reject this payment receipt match? The ingestion status will be marked as FAILED."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === "approve" ? "success" : "danger"}
              size="sm"
              onClick={handleActionConfirm}
            >
              {confirmAction === "approve" ? "Confirm settlement" : "Confirm rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReviewQueuePage
