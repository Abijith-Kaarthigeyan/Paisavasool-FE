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
import { useGrns, useLinkGrnToPurchaseOrder } from "@/features/grn/hooks/useGrns"
import { useToast } from "@/components/ui/toast"
import { useDebouncedValue } from "@/lib/useDebouncedValue"
import type { GoodsReceiptNote } from "@/features/grn/types"
import type { PurchaseOrder } from "../types"

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

interface LinkGrnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseOrder: PurchaseOrder
  linkedGrnIds: string[]
}

export function LinkGrnDialog({
  open,
  onOpenChange,
  purchaseOrder,
  linkedGrnIds,
}: LinkGrnDialogProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [selectedGrnId, setSelectedGrnId] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const debouncedSearch = useDebouncedValue(search)

  const listParams = useMemo(
    () => ({
      limit: 100,
      offset: 0,
      status: "UNLINKED",
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    }),
    [debouncedSearch]
  )

  const { data: grnPage, isLoading } = useGrns(listParams)
  const grns = grnPage?.items ?? []
  const linkMutation = useLinkGrnToPurchaseOrder()

  const selectableGrns = useMemo(() => {
    const available = grns.filter(
      (grn) => !grn.po_id || linkedGrnIds.includes(grn.id)
    )
    return [...available].sort((a, b) => {
      const aMatch = a.po_number === purchaseOrder.po_number ? 0 : 1
      const bMatch = b.po_number === purchaseOrder.po_number ? 0 : 1
      return aMatch - bMatch
    })
  }, [grns, purchaseOrder.po_number, linkedGrnIds])

  const selectedGrn: GoodsReceiptNote | undefined = useMemo(
    () => grns.find((grn) => grn.id === selectedGrnId),
    [grns, selectedGrnId]
  )

  const guardrails = useMemo(() => {
    if (!selectedGrn) return null

    const alreadyLinkedHere =
      selectedGrn.po_id === purchaseOrder.id || linkedGrnIds.includes(selectedGrn.id)
    const poNumberOnGrn = selectedGrn.po_number?.trim() || null
    const poNumberMatch =
      !poNumberOnGrn || poNumberOnGrn === purchaseOrder.po_number
    const linkedElsewhere =
      !!selectedGrn.po_id && selectedGrn.po_id !== purchaseOrder.id

    return {
      alreadyLinkedHere,
      poNumberOnGrn,
      poNumberMatch,
      linkedElsewhere,
      canSubmit: !linkedElsewhere && !alreadyLinkedHere,
    }
  }, [selectedGrn, purchaseOrder, linkedGrnIds])

  useEffect(() => {
    if (!open) {
      setSearch("")
      setSelectedGrnId(null)
      setApiError(null)
    }
  }, [open])

  useEffect(() => {
    setApiError(null)
  }, [selectedGrnId])

  const handleSubmit = async () => {
    if (!selectedGrnId || !guardrails?.canSubmit) return
    setApiError(null)

    try {
      const result = await linkMutation.mutateAsync({
        grnId: selectedGrnId,
        poId: purchaseOrder.id,
      })
      toast({
        title: result.linked ? "GRN linked" : "Already linked",
        description: selectedGrn
          ? `GRN ${selectedGrn.grn_number} linked to PO #${purchaseOrder.po_number}.`
          : `GRN linked to PO #${purchaseOrder.po_number}.`,
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
          <DialogTitle>Link GRN to PO #{purchaseOrder.po_number}</DialogTitle>
          <DialogDescription>
            Select an unlinked goods receipt note. Matching PO numbers are preferred.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="link-grn-search">Search GRNs</Label>
            <Input
              id="link-grn-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by GRN number or PO number…"
            />
          </div>

          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-1">
            {isLoading ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Loading GRNs…
              </p>
            ) : selectableGrns.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No unlinked GRNs found.
              </p>
            ) : (
              selectableGrns.map((grn) => {
                const isLinkedHere =
                  grn.po_id === purchaseOrder.id || linkedGrnIds.includes(grn.id)
                const isSelected = selectedGrnId === grn.id

                return (
                  <button
                    key={grn.id}
                    type="button"
                    onClick={() => setSelectedGrnId(grn.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <span className="font-medium">{grn.grn_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {isLinkedHere
                        ? "Already linked"
                        : grn.po_number
                          ? `PO ref: ${grn.po_number}`
                          : "No PO ref"}
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {selectedGrn && guardrails && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium text-foreground">Guardrail preview</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  {guardrails.poNumberMatch ? (
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                  )}
                  <span>
                    {guardrails.poNumberOnGrn
                      ? guardrails.poNumberMatch
                        ? `GRN PO # (${guardrails.poNumberOnGrn}) matches PO #${purchaseOrder.po_number}`
                        : `GRN references PO #${guardrails.poNumberOnGrn} — differs from PO #${purchaseOrder.po_number} (link allowed)`
                      : `GRN has no PO number — will use PO #${purchaseOrder.po_number} on link`}
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
            {linkMutation.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            )}
            Link GRN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
