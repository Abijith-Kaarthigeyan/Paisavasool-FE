import React, { useState, useEffect, useMemo } from "react"
import { usePaymentReviews, usePaymentDetails, useApproveReview, useRejectReview } from "../hooks/useReviews"
import { useInvoices } from "@/features/invoices/hooks/useInvoices"
import { useQuery } from "@tanstack/react-query"
import { customerService } from "@/features/customers/services/customerService"
import { useCustomerDetail } from "@/features/customers/hooks/useCustomers"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { FilterBar, FilterSelect } from "@/components/ui/filter-bar"
import { Pagination } from "@/components/ui/pagination"
import { getDashboardPath } from "@/lib/navigation"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ConfidenceMeter } from "@/components/ui/confidence-meter"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
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
import { AlertTriangle, Check, CheckCircle, HelpCircle, X } from "lucide-react"

import type { PaymentReviewResponse } from "../types"

const hoverScrollBase = "overflow-x-hidden hover-scroll-y"
const hoverScrollList = cn(hoverScrollBase, "max-h-[280px] space-y-2.5")
const sectionCard = "rounded-lg border border-border bg-card shadow-card"
const sectionLabel = "text-xs font-semibold uppercase tracking-wide text-muted-foreground"

export const ReviewQueuePage: React.FC = () => {
  const { toast } = useToast()
  const [selectedReview, setSelectedReview] = useState<PaymentReviewResponse | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [reasonFilter, setReasonFilter] = useState("")
  const [confidenceFilter, setConfidenceFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const { data: reviews = [], isLoading, isError } = usePaymentReviews()

  const approveMutation = useApproveReview()
  const rejectMutation = useRejectReview()

  const handleRowClick = (reviewItem: PaymentReviewResponse) => {
    setSelectedReview(reviewItem)
    setIsDrawerOpen(true)
  }

  const filterOptions = useMemo(() => {
    const reasons = new Set<string>()
    reviews.forEach((rev) => {
      if (rev.review_reason) reasons.add(rev.review_reason)
    })
    return { reasons: Array.from(reasons).sort() }
  }, [reviews])

  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        rev.review_reason.toLowerCase().includes(term) ||
        (rev.suggested_customer_name || "").toLowerCase().includes(term) ||
        (rev.suggested_customer_code || "").toLowerCase().includes(term)

      const matchesStatus = !statusFilter || rev.status === statusFilter
      const matchesReason = !reasonFilter || rev.review_reason === reasonFilter

      let matchesConfidence = true
      if (confidenceFilter === "high") matchesConfidence = rev.confidence >= 80
      else if (confidenceFilter === "medium")
        matchesConfidence = rev.confidence >= 50 && rev.confidence < 80
      else if (confidenceFilter === "low") matchesConfidence = rev.confidence < 50

      return matchesSearch && matchesStatus && matchesReason && matchesConfidence
    })
  }, [reviews, searchTerm, statusFilter, reasonFilter, confidenceFilter])

  const totalItems = filteredReviews.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedReviews = filteredReviews.slice(startIndex, startIndex + itemsPerPage)

  const hasActiveFilters =
    !!searchTerm || !!statusFilter || !!reasonFilter || !!confidenceFilter

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
    setReasonFilter("")
    setConfidenceFilter("")
    setCurrentPage(1)
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
      <PageBreadcrumb
        items={[
          { label: "Dashboard", to: getDashboardPath() },
          { label: "Payment matching reviews" },
        ]}
      />

      <PageHeader
        title="Payment matching reviews"
      />

      <Card>
        {!isLoading && !isError && reviews.length > 0 && (
          <div className="border-b border-border p-3">
            <FilterBar
              variant="toolbar"
              size="sm"
              searchValue={searchTerm}
              onSearchChange={(value) => {
                setSearchTerm(value)
                setCurrentPage(1)
              }}
              searchPlaceholder="Search by reason or suggested customer…"
              showClear={hasActiveFilters}
              onClear={clearFilters}
            >
              <FilterSelect
                id="filter-status"
                aria-label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </FilterSelect>
              <FilterSelect
                id="filter-reason"
                aria-label="Review reason"
                value={reasonFilter}
                onChange={(e) => {
                  setReasonFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All reasons</option>
                {filterOptions.reasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason.replace(/_/g, " ")}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                id="filter-confidence"
                aria-label="Confidence"
                value={confidenceFilter}
                onChange={(e) => {
                  setConfidenceFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">All confidence levels</option>
                <option value="high">High (80%+)</option>
                <option value="medium">Medium (50–79%)</option>
                <option value="low">Low (&lt;50%)</option>
              </FilterSelect>
            </FilterBar>
          </div>
        )}
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
          ) : filteredReviews.length === 0 ? (
            <EmptyState
              title="No reviews found"
              description="No payment matches match the current filters."
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
                {paginatedReviews.map((rev) => (
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

      {!isLoading && !isError && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={itemsPerPage}
        />
      )}

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="flex h-full flex-col overflow-hidden pb-0">
          <SheetHeader className="shrink-0">
            <SheetTitle>Payment match resolution</SheetTitle>
          </SheetHeader>

          {isPaymentLoading ? (
            <div className="min-h-0 flex-1 space-y-4 overflow-hidden px-0 py-6 hover-scroll-y">
              <TableSkeleton rows={2} columns={1} />
            </div>
          ) : paymentDetails ? (
            <div className="min-h-0 flex-1 space-y-5 overflow-hidden py-4 hover-scroll-y">
              {selectedReview?.confidence !== undefined && (
                <ConfidenceMeter
                  value={selectedReview.confidence}
                  label="Match confidence"
                  size="md"
                />
              )}

              <div className={cn(sectionCard, "grid grid-cols-2 gap-4 bg-muted/20 p-4")}>
                <div className="flex flex-col">
                  <span className={sectionLabel}>Original customer extracted</span>
                  <span className="mt-1 text-sm font-medium text-foreground">
                    {paymentDetails.customer_name_original}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className={sectionLabel}>Payment amount</span>
                  <span className="mt-1 text-lg font-semibold tabular-nums text-primary">
                    {formatCurrency(paymentDetails.payment_amount)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className={sectionLabel}>Payment date</span>
                  <span className="mt-1 text-sm font-medium text-foreground">
                    {new Date(paymentDetails.payment_date).toLocaleDateString()}
                  </span>
                </div>
                {paymentDetails.payment_reference && (
                  <div className="flex flex-col">
                    <span className={sectionLabel}>UTR number</span>
                    <span className="mt-1 text-sm font-medium tracking-wide text-foreground uppercase">
                      {paymentDetails.payment_reference}
                    </span>
                  </div>
                )}
              </div>

              {selectedReview?.suggested_candidates &&
              selectedReview.suggested_candidates.length > 0 ? (
                <div className={cn(sectionCard, "p-4")}>
                  <span className={cn(sectionLabel, "mb-3 block")}>
                    Match suggestions (top candidates)
                  </span>
                  <div className={hoverScrollList}>
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
                            "flex flex-col gap-2.5 rounded-md border p-3 transition-colors",
                            isSelected
                              ? "border-primary/40 bg-primary/5"
                              : "border-border/80 bg-background hover:border-border hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">{cand.customer_name}</p>
                              <p className="mt-0.5 text-xs tracking-wide text-muted-foreground uppercase">
                                {cand.customer_code}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Badge
                                variant={getConfidenceBadgeVariant(cand.confidence)}
                                shape="pill"
                                className="tabular-nums"
                              >
                                {cand.confidence.toFixed(1)}%
                              </Badge>
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                                  <Check className="h-3.5 w-3.5" aria-hidden />
                                  Selected
                                </span>
                              ) : (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 text-xs font-medium"
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
                  <div className={cn(sectionCard, "space-y-3 border-primary/20 bg-primary/5 p-4")}>
                    <div className="flex items-center justify-between">
                      <span className={cn(sectionLabel, "text-primary normal-case tracking-normal")}>
                        Top match candidate
                      </span>
                      <Badge
                        variant={getConfidenceBadgeVariant(selectedReview.confidence)}
                        shape="pill"
                        className="tabular-nums"
                      >
                        {selectedReview.confidence.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {selectedReview.suggested_customer_name}
                        </p>
                        <p className="mt-0.5 text-xs tracking-wide text-muted-foreground uppercase">
                          {selectedReview.suggested_customer_code}
                        </p>
                      </div>
                      {selectedCustomerId !== selectedReview.suggested_customer_id ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-8 shrink-0 text-xs font-medium"
                          onClick={() => {
                            setSelectedCustomerId(selectedReview.suggested_customer_id ?? "")
                            setCustomerCodeInput(selectedReview.suggested_customer_code ?? "")
                          }}
                        >
                          Use suggestion
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                )
              )}

              <div className={cn(sectionCard, "space-y-2.5 p-4")}>
                <Label htmlFor="customer-code" className={sectionLabel}>
                  Resolved customer code
                </Label>
                <div className="relative">
                  <Input
                    id="customer-code"
                    value={customerCodeInput}
                    onChange={(e) => handleCustomerCodeChange(e.target.value)}
                    placeholder="Enter customer code (e.g. CUST-000001)…"
                    className="tracking-wide uppercase"
                  />
                  {isSearchingCustomer && (
                    <div className="absolute right-3 top-2.5">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                    </div>
                  )}
                </div>
                {selectedCustomerId ? (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-success">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
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

              <div className={cn(sectionCard, "space-y-3 p-4")}>
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <Label className={cn(sectionLabel, "normal-case tracking-normal")}>
                    Candidate invoices allocation
                  </Label>
                  {selectedCustomerId && (
                    <Badge
                      variant={allocatableInvoices.length > 0 ? "outline" : "destructive"}
                      shape="pill"
                      className="text-[11px] font-medium"
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
                  <div className={cn(hoverScrollBase, "max-h-[250px] space-y-3")}>
                    {allocatableInvoices.map((inv) => {
                      const isChecked = selectedAllocations.some((a) => a.invoice_id === inv.id)
                      return (
                        <div
                          key={inv.id}
                          className={cn(
                            "flex items-center justify-between rounded-md border p-3 transition-colors",
                            isChecked
                              ? "border-primary/40 bg-primary/5"
                              : "border-border/80 bg-background hover:border-border hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center gap-3">
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
                                  <Badge variant="warning" shape="pill" className="text-[10px]">
                                    Disputed
                                  </Badge>
                                )}
                                {inv.status === "OVERDUE" && (
                                  <Badge variant="destructive" shape="pill" className="text-[10px]">
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
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">₹</span>
                              <Input
                                type="number"
                                step="any"
                                value={allocationInputs[inv.id] || ""}
                                onChange={(e) => handleAmountChange(inv.id, e.target.value)}
                                className="h-9 w-28 text-right tabular-nums"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className={cn(sectionCard, "space-y-3 bg-muted/15 p-4")}>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total cash allocating</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(totalAllocated)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining unallocated</span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      remainingToAllocate < -0.01 ? "text-destructive" : "text-success"
                    )}
                  >
                    {formatCurrency(remainingToAllocate)}
                  </span>
                </div>

                {remainingToAllocate > 0.01 && (
                  <div className="flex items-start gap-2.5 rounded-md border border-warning/20 bg-warning-muted px-3 py-2.5 text-xs leading-relaxed text-warning-foreground">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                    <span>
                      <strong className="font-semibold">Under-allocation:</strong> Remaining balance
                      of {formatCurrency(remainingToAllocate)} will generate a customer credit upon
                      approval.
                    </span>
                  </div>
                )}

                {remainingToAllocate < -0.01 && (
                  <div className="flex items-start gap-2.5 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      <strong className="font-semibold">Error:</strong> Allocated amount exceeds total
                      cash receipt. Please correct invoice allocations.
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <SheetFooter className="mt-0 shrink-0 border-t border-border bg-card/95 px-0 py-4 backdrop-blur-sm">
            {selectedReview?.status === "PENDING" && (
              <div className="flex w-full justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="border-destructive/25 text-destructive hover:border-destructive/40 hover:bg-destructive/5"
                  onClick={() => {
                    setConfirmAction("reject")
                    setIsConfirmOpen(true)
                  }}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                >
                  <X className="h-4 w-4" aria-hidden />
                  Reject match
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
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
                  <Check className="h-4 w-4" aria-hidden />
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
