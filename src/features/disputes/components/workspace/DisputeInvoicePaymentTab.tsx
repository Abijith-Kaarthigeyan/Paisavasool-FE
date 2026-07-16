import { Link } from "react-router-dom"
import { ClipboardList } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CustomerDetail } from "@/features/customers/types"
import type { InvoiceItem } from "@/features/invoices/types"
import { PurchaseOrderSummaryCard } from "@/features/purchase-orders/components/PurchaseOrderSummaryCard"
import { PoInvoiceCompareTable } from "@/features/purchase-orders/components/PoInvoiceCompareTable"
import {
  usePurchaseOrderDetails,
  usePurchaseOrderItems,
} from "@/features/purchase-orders/hooks/usePurchaseOrders"
import { getInvoicePoContext } from "@/features/purchase-orders/utils/poInvoiceContext"
import type { Dispute, DisputeCase, DisputeEvidenceSnapshot } from "../../types"
import {
  extractPaymentReference,
  isPaymentDisputeCategory,
} from "../../utils/disputeWorkspaceUtils"

interface DisputeInvoicePaymentTabProps {
  dispute: Dispute
  disputeCase?: DisputeCase | null
  invoiceItems: InvoiceItem[]
  customerDetail?: CustomerDetail | null
  evidence?: DisputeEvidenceSnapshot[]
  isLoadingInvoiceItems?: boolean
  isLoadingCustomer?: boolean
}

function InvoiceCard({
  dispute,
  invoiceItems,
  isLoading,
}: {
  dispute: Dispute
  invoiceItems: InvoiceItem[]
  isLoading?: boolean
}) {
  const invoice = dispute.invoice

  return (
    <Card>
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base">Invoice</CardTitle>
        <CardDescription>Associated invoice and line items.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4 text-sm">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Invoice number</span>
              <Link
                to={`/invoices/${dispute.invoice_id}`}
                className="font-medium text-primary hover:underline"
              >
                {invoice?.invoice_number || dispute.invoice_number}
              </Link>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={invoice?.status === "PAID" ? "success" : "default"} shape="pill">
                {invoice?.status || "N/A"}
              </Badge>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Invoice date</span>
              <span className="font-medium tabular-nums text-foreground">
                {invoice?.invoice_date
                  ? new Date(invoice.invoice_date).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Due date</span>
              <span className="font-medium tabular-nums text-foreground">
                {invoice?.due_date
                  ? new Date(invoice.due_date).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium tabular-nums text-foreground">
                {invoice?.total_amount != null
                  ? `₹${invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Outstanding</span>
              <span className="font-semibold tabular-nums text-destructive">
                {invoice?.outstanding_amount != null
                  ? `₹${invoice.outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  : "N/A"}
              </span>
            </div>

            {invoiceItems.length > 0 && (
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
                      {invoiceItems.map((item) => (
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
          </>
        )}
      </CardContent>
    </Card>
  )
}

function PaymentCard({
  dispute,
  disputeCase,
  customerDetail,
  evidence,
  isLoading,
}: {
  dispute: Dispute
  disputeCase?: DisputeCase | null
  customerDetail?: CustomerDetail | null
  evidence?: DisputeEvidenceSnapshot[]
  isLoading?: boolean
}) {
  const invoice = dispute.invoice
  const caseBody = disputeCase?.raw_content || disputeCase?.email_body || ""
  const validationSnapshot = evidence?.find(
    (e) =>
      e.snapshot_type.includes("VALIDATION") ||
      e.snapshot_type.includes("PAYMENT")
  )
  const snapshotRef =
    validationSnapshot?.snapshot_data?.payment_reference ||
    validationSnapshot?.snapshot_data?.utr ||
    validationSnapshot?.snapshot_data?.reference
  const paymentRef = extractPaymentReference(
    String(snapshotRef ?? ""),
    caseBody,
    disputeCase?.email_subject
  )

  const recentPayments = (customerDetail?.payments ?? [])
    .slice()
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
    .slice(0, 3)

  return (
    <Card>
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base">Payment</CardTitle>
        <CardDescription>Settlement context for payment disputes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4 text-sm">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Invoice paid status</span>
              <Badge variant={invoice?.status === "PAID" ? "success" : "warning"} shape="pill">
                {invoice?.status === "PAID" ? "Paid" : "Unpaid / partial"}
              </Badge>
            </div>
            {paymentRef && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Reference / UTR</span>
                <span className="font-mono text-xs font-medium text-foreground">{paymentRef}</span>
              </div>
            )}
            {recentPayments.length > 0 ? (
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground">Recent customer payments</p>
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-md border border-border px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-foreground">
                        {payment.payment_reference || "No reference"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums text-foreground">
                        ₹{payment.payment_amount.toLocaleString()}
                      </p>
                      <Badge variant="outline" shape="pill" className="text-[10px]">
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No recent payments on file.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
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

function AwaitingMatchPoBanner({ poNumber }: { poNumber: string }) {
  return (
    <div className="rounded-lg border border-warning/50 bg-warning-muted/10 p-3.5 text-sm leading-relaxed text-warning-foreground">
      Customer referenced PO #{poNumber} but no system PO is linked. Agent may request PO from
      customer.
    </div>
  )
}

export function DisputeInvoicePaymentTab({
  dispute,
  disputeCase,
  invoiceItems,
  customerDetail,
  evidence = [],
  isLoadingInvoiceItems,
  isLoadingCustomer,
}: DisputeInvoicePaymentTabProps) {
  const showPaymentCard = isPaymentDisputeCategory(dispute.dispute_category)
  const isAmendmentDispute = dispute.dispute_category === "AMENDMENT"
  const poContext = getInvoicePoContext(dispute.invoice)

  return (
    <div className="space-y-6">
      <InvoiceCard
        dispute={dispute}
        invoiceItems={invoiceItems}
        isLoading={isLoadingInvoiceItems}
      />
      {isAmendmentDispute && poContext.hasLinkedPo && poContext.poId && (
        <SystemPurchaseOrderCard
          poId={poContext.poId}
          invoice={dispute.invoice}
          invoiceItemCount={invoiceItems.length}
        />
      )}
      {isAmendmentDispute && poContext.hasAwaitingMatch && poContext.poNumber && (
        <AwaitingMatchPoBanner poNumber={poContext.poNumber} />
      )}
      {showPaymentCard && (
        <PaymentCard
          dispute={dispute}
          disputeCase={disputeCase}
          customerDetail={customerDetail}
          evidence={evidence}
          isLoading={isLoadingCustomer}
        />
      )}
    </div>
  )
}
