import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { useInvoices } from "@/features/invoices/hooks/useInvoices"
import { useLinkInvoiceToPurchaseOrder } from "../hooks/usePurchaseOrders"
import { useToast } from "@/components/ui/toast"
import { useDebouncedValue } from "@/lib/useDebouncedValue"
import type { Invoice } from "@/features/invoices/types"
import type { PurchaseOrder } from "../types"

function getApiErrorMessage(error: unknown): string {
  const axiosErr = error as {
    response?: { data?: { error?: { message?: string }; detail?: string } }
  }
  return (
    axiosErr.response?.data?.error?.message ||
    axiosErr.response?.data?.detail ||
    "Failed to link invoice. Please try again."
  )
}

interface LinkInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseOrder: PurchaseOrder
  linkedInvoiceIds: string[]
}

export function LinkInvoiceDialog({
  open,
  onOpenChange,
  purchaseOrder,
  linkedInvoiceIds,
}: LinkInvoiceDialogProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const debouncedSearch = useDebouncedValue(search)

  const listParams = useMemo(
    () => ({
      limit: 100,
      offset: 0,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    }),
    [debouncedSearch]
  )

  const { data: invoices = [], isLoading } = useInvoices(listParams)
  const linkMutation = useLinkInvoiceToPurchaseOrder(purchaseOrder.id)

  const selectableInvoices = useMemo(() => {
    const unlinkedOrHere = invoices.filter(
      (inv) => !inv.po_id || inv.po_id === purchaseOrder.id || linkedInvoiceIds.includes(inv.id)
    )
    return [...unlinkedOrHere].sort((a, b) => {
      const aPo = a.po_number === purchaseOrder.po_number ? 0 : 1
      const bPo = b.po_number === purchaseOrder.po_number ? 0 : 1
      if (aPo !== bPo) return aPo - bPo
      const aCust = a.customer_id === purchaseOrder.customer_id ? 0 : 1
      const bCust = b.customer_id === purchaseOrder.customer_id ? 0 : 1
      return aCust - bCust
    })
  }, [invoices, purchaseOrder, linkedInvoiceIds])

  const selectedInvoice: Invoice | undefined = useMemo(
    () => invoices.find((inv) => inv.id === selectedInvoiceId),
    [invoices, selectedInvoiceId]
  )

  const guardrails = useMemo(() => {
    if (!selectedInvoice) return null

    const alreadyLinkedHere =
      selectedInvoice.po_id === purchaseOrder.id || linkedInvoiceIds.includes(selectedInvoice.id)

    const customerMatch = selectedInvoice.customer_id === purchaseOrder.customer_id
    const poNumberOnInvoice = selectedInvoice.po_number?.trim() || null
    const poNumberMatch =
      !poNumberOnInvoice || poNumberOnInvoice === purchaseOrder.po_number
    const linkedElsewhere =
      !!selectedInvoice.po_id && selectedInvoice.po_id !== purchaseOrder.id

    return {
      alreadyLinkedHere,
      customerMatch,
      poNumberOnInvoice,
      poNumberMatch,
      linkedElsewhere,
      canSubmit: poNumberMatch && !linkedElsewhere && !alreadyLinkedHere,
    }
  }, [selectedInvoice, purchaseOrder, linkedInvoiceIds])

  useEffect(() => {
    if (!open) {
      setSearch("")
      setSelectedInvoiceId(null)
      setApiError(null)
    }
  }, [open])

  useEffect(() => {
    setApiError(null)
  }, [selectedInvoiceId])

  const handleSubmit = async () => {
    if (!selectedInvoiceId || !guardrails?.canSubmit) return
    setApiError(null)

    try {
      const result = await linkMutation.mutateAsync(selectedInvoiceId)
      toast({
        title: result.linked ? "Invoice linked" : "Already linked",
        description: result.linked
          ? `Invoice linked to PO #${purchaseOrder.po_number}.`
          : `This invoice was already linked to PO #${purchaseOrder.po_number}.`,
        type: "success",
      })
      onOpenChange(false)
    } catch (error) {
      setApiError(getApiErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Link invoice to PO #{purchaseOrder.po_number}</DialogTitle>
          <DialogDescription>
            Select an invoice to link. Matching PO numbers are preferred; customer-name
            drift from OCR is allowed when the PO number matches.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="link-invoice-search">Search invoices</Label>
            <Input
              id="link-invoice-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice number…"
            />
          </div>

          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-1">
            {isLoading ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Loading invoices…</p>
            ) : selectableInvoices.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No matching invoices found.
              </p>
            ) : (
              selectableInvoices.map((inv) => {
                const isLinkedHere =
                  inv.po_id === purchaseOrder.id || linkedInvoiceIds.includes(inv.id)
                const isLinkedElsewhere = !!inv.po_id && inv.po_id !== purchaseOrder.id
                const isSelected = selectedInvoiceId === inv.id

                return (
                  <button
                    key={inv.id}
                    type="button"
                    disabled={isLinkedElsewhere}
                    onClick={() => setSelectedInvoiceId(inv.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-muted/60 text-foreground"
                    } ${isLinkedElsewhere ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <span className="font-medium">{inv.invoice_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {isLinkedHere
                        ? "Already linked"
                        : isLinkedElsewhere
                          ? "Linked to another PO"
                          : inv.po_number
                            ? `PO ref: ${inv.po_number}`
                            : "No PO ref"}
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {selectedInvoice && guardrails && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium text-foreground">Guardrail preview</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  {guardrails.customerMatch ? (
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                  )}
                  <span>
                    {guardrails.customerMatch
                      ? "Customer matches this purchase order"
                      : "Customer name differs (common with OCR) — link allowed if PO number matches"}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  {guardrails.poNumberMatch ? (
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                  )}
                  <span>
                    {guardrails.poNumberOnInvoice
                      ? guardrails.poNumberMatch
                        ? `Invoice PO # (${guardrails.poNumberOnInvoice}) matches PO #${purchaseOrder.po_number}`
                        : `Invoice references PO #${guardrails.poNumberOnInvoice} — does not match PO #${purchaseOrder.po_number}`
                      : `Invoice has no PO number — will use PO #${purchaseOrder.po_number} on link`}
                  </span>
                </li>
                {guardrails.alreadyLinkedHere && (
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>Already linked to this purchase order</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {apiError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {apiError}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!guardrails?.canSubmit || linkMutation.isPending}
            onClick={handleSubmit}
          >
            {linkMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            Link invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
