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
import { usePurchaseOrders } from "@/features/purchase-orders/hooks/usePurchaseOrders"
import { useLinkGrnToPurchaseOrder } from "../hooks/useGrns"
import { useToast } from "@/components/ui/toast"
import { useDebouncedValue } from "@/lib/useDebouncedValue"
import type { GoodsReceiptNote } from "../types"
import type { PurchaseOrder } from "@/features/purchase-orders/types"

function getApiErrorMessage(error: unknown): string {
  const axiosErr = error as {
    response?: { data?: { error?: { message?: string }; detail?: string } }
  }
  return (
    axiosErr.response?.data?.error?.message ||
    axiosErr.response?.data?.detail ||
    "Failed to link GRN. Please try again."
  )
}

interface LinkGrnToPoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  grn: GoodsReceiptNote
}

export function LinkGrnToPoDialog({ open, onOpenChange, grn }: LinkGrnToPoDialogProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null)
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

  const { data: poPage, isLoading } = usePurchaseOrders(listParams)
  const purchaseOrders = poPage?.items ?? []
  const linkMutation = useLinkGrnToPurchaseOrder()

  const selectablePos = useMemo(() => {
    return [...purchaseOrders].sort((a, b) => {
      const aMatch = grn.po_number && a.po_number === grn.po_number ? 0 : 1
      const bMatch = grn.po_number && b.po_number === grn.po_number ? 0 : 1
      return aMatch - bMatch
    })
  }, [purchaseOrders, grn.po_number])

  const selectedPo: PurchaseOrder | undefined = useMemo(
    () => purchaseOrders.find((po) => po.id === selectedPoId),
    [purchaseOrders, selectedPoId]
  )

  const poNumberMismatch = useMemo(() => {
    if (!selectedPo || !grn.po_number?.trim()) return false
    return grn.po_number.trim() !== selectedPo.po_number
  }, [selectedPo, grn.po_number])

  useEffect(() => {
    if (!open) {
      setSearch("")
      setSelectedPoId(null)
      setApiError(null)
    }
  }, [open])

  useEffect(() => {
    setApiError(null)
  }, [selectedPoId])

  const handleSubmit = async () => {
    if (!selectedPoId) return
    setApiError(null)

    try {
      const result = await linkMutation.mutateAsync({
        grnId: grn.id,
        poId: selectedPoId,
      })
      toast({
        title: result.linked ? "GRN linked" : "Already linked",
        description: selectedPo
          ? `GRN ${grn.grn_number} linked to PO #${selectedPo.po_number}.`
          : `GRN ${grn.grn_number} linked successfully.`,
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
          <DialogTitle>Link GRN {grn.grn_number} to a purchase order</DialogTitle>
          <DialogDescription>
            Select a purchase order. Matching extracted PO numbers are listed first.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="link-grn-po-search">Search purchase orders</Label>
            <Input
              id="link-grn-po-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by PO number or customer…"
            />
          </div>

          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-1">
            {isLoading ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Loading purchase orders…
              </p>
            ) : selectablePos.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No matching purchase orders found.
              </p>
            ) : (
              selectablePos.map((po) => {
                const isSelected = selectedPoId === po.id
                const matchesExtracted =
                  !!grn.po_number && po.po_number === grn.po_number

                return (
                  <button
                    key={po.id}
                    type="button"
                    onClick={() => setSelectedPoId(po.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <span className="font-medium">{po.po_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {matchesExtracted
                        ? "Matches extracted PO #"
                        : po.customer?.customer_name || "Purchase order"}
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {selectedPo && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium text-foreground">Link preview</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  {poNumberMismatch ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                  ) : (
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  )}
                  <span>
                    {grn.po_number
                      ? poNumberMismatch
                        ? `Extracted PO #${grn.po_number} differs from selected PO #${selectedPo.po_number} — link still allowed`
                        : `Extracted PO #${grn.po_number} matches selected PO`
                      : `GRN has no extracted PO number — will use PO #${selectedPo.po_number}`}
                  </span>
                </li>
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
            disabled={!selectedPoId || linkMutation.isPending}
            onClick={handleSubmit}
          >
            {linkMutation.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            )}
            Link to PO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
