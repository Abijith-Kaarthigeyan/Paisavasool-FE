import { Link } from "react-router-dom"
import { ClipboardList, Package } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { InvoiceItem } from "@/features/invoices/types"
import type { GoodsReceiptNote, GrnStatus } from "@/features/grn/types"
import { PurchaseOrderSummaryCard } from "@/features/purchase-orders/components/PurchaseOrderSummaryCard"
import { PoInvoiceCompareTable } from "@/features/purchase-orders/components/PoInvoiceCompareTable"
import {
  usePurchaseOrderDetails,
  usePurchaseOrderGrns,
  usePurchaseOrderItems,
} from "@/features/purchase-orders/hooks/usePurchaseOrders"
import { getInvoicePoContext } from "@/features/purchase-orders/utils/poInvoiceContext"
import type { Dispute } from "../../types"

interface DisputePurchaseOrderGrnsTabProps {
  dispute: Dispute
  invoiceItems: InvoiceItem[]
}

function grnStatusVariant(status: GrnStatus): "success" | "warning" | "destructive" | "outline" {
  switch (status) {
    case "LINKED":
      return "success"
    case "UNLINKED":
      return "warning"
    case "FAILED":
      return "destructive"
    default:
      return "outline"
  }
}

function truncateNotes(notes: string | null, max = 80): string {
  if (!notes) return "—"
  const trimmed = notes.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max)}…`
}

function AwaitingMatchPoBanner({ poNumber }: { poNumber: string }) {
  return (
    <div className="rounded-lg border border-warning/50 bg-warning-muted/10 p-3.5 text-sm leading-relaxed text-warning-foreground">
      Customer referenced PO #{poNumber} but no system PO is linked. Agent may request PO from
      customer.
    </div>
  )
}

function SystemPurchaseOrderCard({
  poId,
  invoice,
  invoiceItemCount,
}: {
  poId: string
  invoice: Dispute["invoice"]
  invoiceItemCount: number
}) {
  const { data: purchaseOrder, isLoading: isLoadingPo } = usePurchaseOrderDetails(poId)
  const { data: poItems = [], isLoading: isLoadingItems } = usePurchaseOrderItems(poId)
  const isLoading = isLoadingPo || isLoadingItems

  const summary =
    purchaseOrder ??
    (invoice?.purchase_order
      ? {
          id: invoice.purchase_order.id,
          po_number: invoice.purchase_order.po_number,
          po_date: invoice.purchase_order.po_date,
          requested_delivery_date: invoice.purchase_order.requested_delivery_date,
          currency: invoice.purchase_order.currency,
          total_amount: invoice.purchase_order.total_amount,
          status: invoice.purchase_order.status,
        }
      : null)

  return (
    <Card>
      <CardHeader className="border-b border-border pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" aria-hidden />
              System purchase order
            </CardTitle>
            <CardDescription>Linked PO from the AR system used as primary evidence.</CardDescription>
          </div>
          <Badge variant="info" shape="pill" className="shrink-0">
            Primary evidence — from AR system
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4 text-sm">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : summary ? (
          <>
            <PurchaseOrderSummaryCard purchaseOrder={summary} />

            {poItems.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Line items</p>
                <div className="max-h-72 overflow-y-auto rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Description</TableHead>
                        <TableHead className="text-right text-xs">Qty</TableHead>
                        <TableHead className="text-right text-xs">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {poItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="max-w-[200px] truncate text-xs">
                            {item.description}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            ₹{item.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {purchaseOrder && (
              <PoInvoiceCompareTable
                purchaseOrder={purchaseOrder}
                poItems={poItems}
                invoice={invoice ?? {}}
                invoiceItemCount={invoiceItemCount}
              />
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Linked purchase order could not be loaded.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function LinkedGrnsCard({ poId }: { poId: string }) {
  const { data: grns = [], isLoading } = usePurchaseOrderGrns(poId)

  return (
    <Card>
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4 text-primary" aria-hidden />
          Linked goods receipt notes
        </CardTitle>
        <CardDescription>GRNs attached to this purchase order.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : grns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No goods receipt notes linked to this purchase order.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">GRN number</TableHead>
                  <TableHead className="text-xs">GRN date</TableHead>
                  <TableHead className="text-center text-xs">Status</TableHead>
                  <TableHead className="text-xs">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grns.map((grn: GoodsReceiptNote) => (
                  <TableRow key={grn.id}>
                    <TableCell className="text-xs font-medium">
                      <Link
                        to={`/grns/${grn.id}`}
                        className="text-primary hover:underline"
                      >
                        {grn.grn_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">
                      {new Date(grn.grn_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={grnStatusVariant(grn.status)} shape="pill" className="text-[10px]">
                        {grn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                      {truncateNotes(grn.notes)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DisputePurchaseOrderGrnsTab({
  dispute,
  invoiceItems,
}: DisputePurchaseOrderGrnsTabProps) {
  const poContext = getInvoicePoContext(dispute.invoice)

  if (!poContext.hasLinkedPo && !poContext.hasAwaitingMatch) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-6 w-6 text-muted-foreground" />}
        title="No purchase order linked"
        description="No purchase order is linked to this invoice."
      />
    )
  }

  return (
    <div className="space-y-6">
      {poContext.hasAwaitingMatch && poContext.poNumber && (
        <AwaitingMatchPoBanner poNumber={poContext.poNumber} />
      )}
      {poContext.hasLinkedPo && poContext.poId && (
        <>
          <SystemPurchaseOrderCard
            poId={poContext.poId}
            invoice={dispute.invoice}
            invoiceItemCount={invoiceItems.length}
          />
          <LinkedGrnsCard poId={poContext.poId} />
        </>
      )}
    </div>
  )
}
