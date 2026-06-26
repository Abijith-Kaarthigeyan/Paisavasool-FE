import { Link } from "react-router-dom"
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
import type { Dispute, DisputeCase, DisputeEvidenceSnapshot } from "../../types"
import {
  extractPaymentReference,
  isPaymentDisputeCategory,
} from "../../utils/disputeWorkspaceUtils"

interface DisputeContextRailProps {
  dispute: Dispute
  disputeCase?: DisputeCase | null
  invoiceItems: InvoiceItem[]
  customerDetail?: CustomerDetail | null
  evidence?: DisputeEvidenceSnapshot[]
  isLoadingInvoiceItems?: boolean
  isLoadingCustomer?: boolean
}

function CustomerCard({
  dispute,
  customerDetail,
  isLoading,
}: {
  dispute: Dispute
  customerDetail?: CustomerDetail | null
  isLoading?: boolean
}) {
  const customer = customerDetail?.customer ?? dispute.customer

  return (
    <Card>
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base">Customer</CardTitle>
        <CardDescription>Account holder for this dispute.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4 text-sm">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Name</span>
              {customer?.id ? (
                <Link
                  to={`/customers/${customer.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {customer.customer_name}
                </Link>
              ) : (
                <span className="font-medium text-foreground">Pending</span>
              )}
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Customer code</span>
              <span className="font-mono font-medium text-foreground">
                {customer?.customer_code || "N/A"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span className="max-w-[160px] truncate font-mono text-xs font-medium text-foreground">
                {customer?.email || "N/A"}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
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
                <div className="max-h-48 overflow-y-auto rounded-md border border-border">
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
                          <TableCell className="max-w-[120px] truncate text-xs">
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

export function DisputeContextRail({
  dispute,
  disputeCase,
  invoiceItems,
  customerDetail,
  evidence = [],
  isLoadingInvoiceItems,
  isLoadingCustomer,
}: DisputeContextRailProps) {
  const showPaymentCard = isPaymentDisputeCategory(dispute.dispute_category)

  return (
    <div className="space-y-6">
      <CustomerCard
        dispute={dispute}
        customerDetail={customerDetail}
        isLoading={isLoadingCustomer}
      />
      <InvoiceCard dispute={dispute} invoiceItems={invoiceItems} isLoading={isLoadingInvoiceItems} />
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
