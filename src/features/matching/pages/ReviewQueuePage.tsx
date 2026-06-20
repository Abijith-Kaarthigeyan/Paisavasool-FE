import React, { useState, useEffect } from "react"
import { usePaymentReviews, usePaymentDetails, useApproveReview, useRejectReview } from "../hooks/useReviews"
import { useInvoices } from "@/features/invoices/hooks/useInvoices"
import { useQuery } from "@tanstack/react-query"
import { customerService } from "@/features/customers/services/customerService"
import { useCustomerDetail } from "@/features/customers/hooks/useCustomers"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { 
  AlertTriangle, 
  CheckCircle
} from "lucide-react"

export const ReviewQueuePage: React.FC = () => {
  const { toast } = useToast();
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Confirmation state
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Fetch reviews queue
  const { data: reviews = [], isLoading, isError } = usePaymentReviews();

  // Mutation hooks
  const approveMutation = useApproveReview();
  const rejectMutation = useRejectReview();

  const handleRowClick = (reviewItem: any) => {
    setSelectedReview(reviewItem);
    setIsDrawerOpen(true);
  };

  const handleActionConfirm = () => {
    if (!selectedReview) return;
    setIsConfirmOpen(false);

    if (confirmAction === "approve") {
      // In the drawer, we execute local allocations check
      const resolvedCustId = selectedCustomerId;
      
      const payload = {
        resolved_customer_id: resolvedCustId && resolvedCustId !== "" ? resolvedCustId : null,
        explicit_allocations: selectedAllocations.map(a => ({
          invoice_id: a.invoice_id,
          amount: parseFloat(a.amount.toString()),
        })),
      };

      approveMutation.mutate(
        { id: selectedReview.id, data: payload },
        {
          onSuccess: () => {
            toast({
              title: "Review Approved",
              description: "Payment match resolved and settled successfully.",
              type: "success",
            });
            setIsDrawerOpen(false);
            resetAllocations();
          },
          onError: (err: any) => {
            toast({
              title: "Approval Failed",
              description: err.response?.data?.detail || "Failed to approve payment match.",
              type: "error",
            });
          },
        }
      );
    } else if (confirmAction === "reject") {
      rejectMutation.mutate(selectedReview.id, {
        onSuccess: () => {
          toast({
            title: "Review Rejected",
            description: "Payment match has been rejected. Upload marked as FAILED.",
            type: "success",
          });
          setIsDrawerOpen(false);
          resetAllocations();
        },
        onError: (err: any) => {
          toast({
            title: "Rejection Failed",
            description: err.response?.data?.detail || "Failed to reject payment match.",
            type: "error",
          });
        },
      });
    }
  };

  // Drawer allocations state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerCodeInput, setCustomerCodeInput] = useState<string>("");
  const [selectedAllocations, setSelectedAllocations] = useState<Array<{ invoice_id: string; invoice_number: string; amount: number }>>([]);
  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({});

  const resetAllocations = () => {
    setSelectedCustomerId("");
    setCustomerCodeInput("");
    setSelectedAllocations([]);
    setAllocationInputs({});
  };

  const handleCustomerCodeChange = (val: string) => {
    setCustomerCodeInput(val);
    setSelectedAllocations([]);
    setAllocationInputs({});
  };

  // Fetch payment details for selected review item
  const { data: paymentDetails, isLoading: isPaymentLoading } = usePaymentDetails(
    selectedReview?.payment_id
  );

  // Fetch customer details if a customer_id is assigned (e.g. loaded from backend review details)
  const { data: matchedCustomerDetail } = useCustomerDetail(
    paymentDetails?.customer_id || undefined
  );

  // Set default customer ID and code when paymentDetails and matchedCustomerDetail load
  useEffect(() => {
    if (paymentDetails?.customer_id) {
      setSelectedCustomerId(paymentDetails.customer_id);
      if (matchedCustomerDetail?.customer?.customer_code) {
        setCustomerCodeInput(matchedCustomerDetail.customer.customer_code);
      }
    } else {
      setSelectedCustomerId("");
      setCustomerCodeInput("");
    }
  }, [paymentDetails, matchedCustomerDetail]);

  // Query customers dynamically when customerCodeInput is modified
  const trimmedCode = customerCodeInput.trim();
  const { data: searchedCustomers, isFetching: isSearchingCustomer } = useQuery({
    queryKey: ["customers", { customer_code: trimmedCode }],
    queryFn: () => customerService.getCustomers({ customer_code: trimmedCode }),
    enabled: trimmedCode.length >= 3,
  });

  // Find the resolved customer matching the input
  const resolvedCustomer = searchedCustomers?.find(
    (c) => c.customer_code.toLowerCase() === trimmedCode.toLowerCase()
  );

  // Update selectedCustomerId based on code match
  useEffect(() => {
    if (resolvedCustomer) {
      setSelectedCustomerId(resolvedCustomer.id);
    } else {
      // Keep selectedCustomerId if the input matches the pre-loaded customer code
      if (
        matchedCustomerDetail?.customer?.customer_code.toLowerCase() ===
        trimmedCode.toLowerCase()
      ) {
        setSelectedCustomerId(paymentDetails?.customer_id || "");
      } else {
        setSelectedCustomerId("");
      }
    }
  }, [resolvedCustomer, trimmedCode, matchedCustomerDetail, paymentDetails]);

  // Fetch open invoices for resolved customer
  const { data: customerInvoices = [], isLoading: isCustomerInvoicesLoading } = useInvoices(
    selectedCustomerId ? { customer_id: selectedCustomerId } : undefined
  );

  // Filter open invoices (PENDING, PARTIALLY_PAID)
  const openInvoices = customerInvoices.filter(inv => inv.status === "PENDING" || inv.status === "PARTIALLY_PAID");

  const totalAllocated = selectedAllocations.reduce((sum, a) => sum + a.amount, 0);
  const remainingToAllocate = paymentDetails ? paymentDetails.payment_amount - totalAllocated : 0;

  const handleCheckboxToggle = (invoice: any) => {
    const exists = selectedAllocations.some(a => a.invoice_id === invoice.id);
    if (exists) {
      setSelectedAllocations(prev => prev.filter(a => a.invoice_id !== invoice.id));
      const inputs = { ...allocationInputs };
      delete inputs[invoice.id];
      setAllocationInputs(inputs);
    } else {
      // Allocate outstanding or remaining, whichever is smaller
      const defaultAlloc = Math.min(invoice.outstanding_amount, remainingToAllocate > 0 ? remainingToAllocate : 0);
      setSelectedAllocations(prev => [...prev, { invoice_id: invoice.id, invoice_number: invoice.invoice_number, amount: defaultAlloc }]);
      setAllocationInputs(prev => ({ ...prev, [invoice.id]: defaultAlloc.toString() }));
    }
  };

  const handleAmountChange = (invoiceId: string, value: string) => {
    setAllocationInputs(prev => ({ ...prev, [invoiceId]: value }));
    const numeric = parseFloat(value) || 0;

    setSelectedAllocations(prev =>
      prev.map(a => (a.invoice_id === invoiceId ? { ...a, amount: numeric } : a))
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === "APPROVED") return "success";
    if (status === "REJECTED") return "destructive";
    return "warning";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground m-0">
          Payment Matching Human Reviews
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review wire payments flagged with ambiguous matching scores, select correct customer records, and explicitly allocate cash receipts to invoices.
        </p>
      </header>

      {/* Review Queue Table Card */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isError ? (
            <div className="p-12 text-center text-rose-500 font-semibold bg-rose-500/5 border-rose-500/20 border rounded-lg">
              Failed to load pending payment reviews. Verify AR service microservice is active.
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-semibold flex flex-col items-center">
              <CheckCircle className="h-10 w-10 text-emerald-500 mb-3" />
              Human review queue is currently empty. All matches resolved automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-xs font-semibold bg-slate-50/50 dark:bg-zinc-900/10">
                    <th className="py-3 px-4">Payment Receipt</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Review Reason</th>
                    <th className="py-3 px-4">Uploaded At</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reviews.map((rev) => (
                    <tr
                      key={rev.id}
                      onClick={() => handleRowClick(rev)}
                      className={`hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors ${
                        selectedReview?.id === rev.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-muted-foreground font-semibold">
                        Wire Transfer
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <div className="flex flex-col">
                          <span className={rev.confidence >= 90 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-amber-600 dark:text-amber-500 font-bold"}>
                            {rev.confidence.toFixed(1)}% Match
                          </span>
                          {rev.suggested_customer_name && (
                            <span className="text-[10px] text-muted-foreground font-normal mt-0.5">
                              to {rev.suggested_customer_name} ({rev.suggested_customer_code})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground truncate max-w-[320px]" title={rev.review_reason}>
                        {rev.review_reason}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Badge variant={getStatusBadgeVariant(rev.status)} className="text-[10px] py-0.5 px-2.5 uppercase font-bold tracking-wider">
                          {rev.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Details Drawer Sheet */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="overflow-y-auto pb-10">
          <SheetHeader>
            <SheetTitle>Payment Match Resolution</SheetTitle>
            <SheetDescription>Verify bank wire metadata and allocate cash amounts.</SheetDescription>
          </SheetHeader>

          {isPaymentLoading ? (
            <div className="space-y-4 py-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : paymentDetails ? (
            <div className="space-y-6 pt-4 text-sm">
              {/* Payment Summary Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-border">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Original Customer extracted</span>
                  <span className="font-bold text-foreground mt-0.5">{paymentDetails.customer_name_original}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Payment Amount</span>
                  <span className="font-extrabold text-foreground mt-0.5 text-base text-primary">
                    {paymentDetails.currency} {paymentDetails.payment_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Payment Date</span>
                  <span className="font-semibold text-foreground mt-0.5">
                    {new Date(paymentDetails.payment_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Confidence Score</span>
                  <span className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                    <Badge variant={selectedReview?.confidence >= 90 ? "success" : "warning"} className="py-0 px-2 uppercase font-bold text-[10px]">
                      {selectedReview?.confidence.toFixed(1)}% Match
                    </Badge>
                  </span>
                </div>
              </div>

              {/* Suggestion Card */}
              {/* Suggestion Card */}
              {selectedReview?.suggested_candidates && selectedReview.suggested_candidates.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Match Suggestions (Top 5 Candidates)</span>
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {selectedReview.suggested_candidates.map((cand: any) => {
                      const isSelected = selectedCustomerId === cand.customer_id;
                      return (
                        <div
                          key={cand.customer_id}
                          className={`border rounded-xl p-3.5 flex flex-col gap-2 transition-all ${
                            isSelected
                              ? "bg-primary/5 border-primary"
                              : "bg-card hover:bg-slate-50/50 border-border"
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-foreground">{cand.customer_name}</p>
                              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{cand.customer_code}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={cand.confidence >= 90 ? "success" : "warning"}
                                className="py-0 px-2 uppercase font-bold text-[9px]"
                              >
                                {cand.confidence.toFixed(1)}% Match
                              </Badge>
                              {isSelected ? (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0 ml-1">
                                  ✓ Selected
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCustomerId(cand.customer_id);
                                    setCustomerCodeInput(cand.customer_code);
                                  }}
                                  className="bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-xs transition-all shrink-0"
                                >
                                  Use Suggestion
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                selectedReview?.suggested_customer_name && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">Top Match Candidate</span>
                      <Badge variant={selectedReview.confidence >= 90 ? "success" : "warning"} className="py-0 px-2 uppercase font-bold text-[9px]">
                        {selectedReview.confidence.toFixed(1)}% Match
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-foreground">{selectedReview.suggested_customer_name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{selectedReview.suggested_customer_code}</p>
                      </div>
                      {selectedCustomerId !== selectedReview.suggested_customer_id ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(selectedReview.suggested_customer_id);
                            setCustomerCodeInput(selectedReview.suggested_customer_code);
                          }}
                          className="bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all"
                        >
                          Use Suggestion
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          ✓ Selected
                        </span>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* Resolved Customer Assignment Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Resolved Customer Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerCodeInput}
                    onChange={(e) => handleCustomerCodeChange(e.target.value)}
                    placeholder="Enter customer code (e.g. CUST-000001)..."
                    className="w-full rounded-lg border border-input bg-background p-2 font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-hidden text-foreground uppercase"
                  />
                  {isSearchingCustomer && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
                {/* Status messages for premium feel */}
                {selectedCustomerId ? (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    ✓ Customer resolved: {
                      (resolvedCustomer?.customer_name) || 
                      (matchedCustomerDetail?.customer?.customer_name)
                    }
                  </p>
                ) : customerCodeInput.trim().length >= 3 ? (
                  <p className="text-[10px] text-rose-500 font-semibold animate-pulse mt-1">
                    ✗ No active customer found with code "{customerCodeInput}"
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Enter customer code to query open invoices.
                  </p>
                )}
              </div>

              {/* Match candidate Invoices Selection */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Candidate Invoices Allocation</label>
                  {selectedCustomerId && (
                    <Badge variant={openInvoices.length > 0 ? "outline" : "destructive"} className="text-[10px] py-0 px-2.5 font-bold">
                      {openInvoices.length} Open Invoices
                    </Badge>
                  )}
                </div>

                {isCustomerInvoicesLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : !selectedCustomerId ? (
                  <div className="text-center py-6 text-xs text-muted-foreground italic bg-slate-50/30 rounded-lg border">
                    Set a Customer reference to view open matching candidates.
                  </div>
                ) : openInvoices.length === 0 ? (
                  <div className="text-center py-6 text-xs text-rose-500 font-semibold bg-rose-50/30 rounded-lg border border-rose-500/25">
                    No open invoices found for this Customer in the billing registry.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {openInvoices.map((inv) => {
                      const isChecked = selectedAllocations.some(a => a.invoice_id === inv.id);
                      return (
                        <div
                          key={inv.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            isChecked ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCheckboxToggle(inv)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <div>
                              <p className="text-xs font-bold text-foreground">{inv.invoice_number}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Outstanding: {inv.currency} {inv.outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>

                          {isChecked && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground font-semibold">{inv.currency}</span>
                              <input
                                type="number"
                                step="any"
                                value={allocationInputs[inv.id] || ""}
                                onChange={(e) => handleAmountChange(inv.id, e.target.value)}
                                className="w-24 rounded border border-input bg-background p-1 text-xs text-right text-foreground font-mono focus:ring-1 focus:ring-primary focus:outline-hidden"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Allocations summary status */}
              <div className="border-t border-border pt-4 space-y-2.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Total Cash Allocating:</span>
                  <span className="text-foreground font-mono">
                    {paymentDetails.currency} {totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Remaining Unallocated:</span>
                  <span className={`font-mono ${
                    remainingToAllocate < -0.01 ? "text-rose-500 font-extrabold animate-pulse" : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {paymentDetails.currency} {remainingToAllocate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {remainingToAllocate > 0.01 && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-500/25 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Under-allocation:</strong> Remaining balance of {paymentDetails.currency} {remainingToAllocate.toLocaleString()} will generate a **Customer Credit** upon approval.
                    </span>
                  </div>
                )}

                {remainingToAllocate < -0.01 && (
                  <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-500/25 p-3 text-xs text-rose-500 flex items-start gap-2 animate-pulse">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Error:</strong> Allocated amount exceeds total cash receipt. Please correct invoice allocations.
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Drawer Actions */}
          <SheetFooter>
            {selectedReview?.status === "PENDING" && (
              <div className="flex justify-end space-x-3 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmAction("reject");
                    setIsConfirmOpen(true);
                  }}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                  className="flex-1 sm:flex-initial rounded-lg border border-destructive bg-transparent hover:bg-destructive hover:text-destructive-foreground transition-colors px-4 py-2.5 text-xs font-bold text-destructive"
                >
                  Reject Match
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmAction("approve");
                    setIsConfirmOpen(true);
                  }}
                  disabled={
                    rejectMutation.isPending || 
                    approveMutation.isPending || 
                    remainingToAllocate < -0.01 || 
                    !selectedCustomerId
                  }
                  className="flex-1 sm:flex-initial rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors disabled:opacity-50"
                >
                  Approve Allocation
                </button>
              </div>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Review Settlement</DialogTitle>
            <DialogDescription>
              {confirmAction === "approve"
                ? `Confirm cash settlement for this customer. Allocations total is ${paymentDetails?.currency} ${totalAllocated.toLocaleString()}.`
                : "Are you sure you want to reject this payment receipt match? The ingestion status will be marked as FAILED."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleActionConfirm}
              className={`rounded-lg px-4 py-2 text-xs font-bold text-white transition-colors ${
                confirmAction === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-destructive hover:bg-destructive/90"
              }`}
            >
              {confirmAction === "approve" ? "Confirm Settlement" : "Confirm Rejection"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewQueuePage;
