import React, { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  usePurchaseOrderDetails,
  usePurchaseOrderItems,
  usePurchaseOrderInvoices,
} from "../hooks/usePurchaseOrders"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { INVOICE_STATUS_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import { formatCurrency } from "@/lib/formatCurrency"
import { getDashboardPath } from "@/lib/navigation"
import {
  Calendar,
  User,
  HelpCircle,
  FileSpreadsheet,
  Link2,
  ClipboardList,
  Plus,
} from "lucide-react"
import { PurchaseOrderStatusBadge } from "../components/PurchaseOrderStatusBadge"
import { LinkInvoiceDialog } from "../components/LinkInvoiceDialog"
import type { Invoice } from "@/features/invoices/types"

const getDisplayInvoiceStatus = (invoice: Invoice): string => {
  if (invoice.status !== "OVERDUE") {
    return invoice.status
  }
  return invoice.outstanding_amount >= invoice.total_amount
    ? "PENDING"
    : "PARTIALLY_PAID"
}

function LinkedInvoicesTable({
  invoices,
  isLoading,
  onRowClick,
}: {
  invoices: Invoice[]
  isLoading: boolean
  onRowClick: (invoiceId: string) => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <EmptyState
        title="No linked invoices"
        description="No invoices are linked to this purchase order yet."
        className="py-8"
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice number</TableHead>
          <TableHead>Invoice date</TableHead>
          <TableHead>Due date</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => {
          const displayStatus = getDisplayInvoiceStatus(inv)
          return (
            <TableRow
              key={inv.id}
              className="cursor-pointer"
              onClick={() => onRowClick(inv.id)}
            >
              <TableCell className="font-medium text-foreground">
                {inv.invoice_number}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(inv.invoice_date).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(inv.due_date).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums text-foreground">
                {formatCurrency(inv.total_amount)}
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant={getStatusVariant(INVOICE_STATUS_VARIANT, displayStatus)}
                  shape="pill"
                >
                  {displayStatus.replace(/_/g, " ")}
                </Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export const PurchaseOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("overview")
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)

  const { data: po, isLoading: isDetailsLoading, error: detailsError } =
    usePurchaseOrderDetails(id)
  const { data: items = [], isLoading: isItemsLoading } = usePurchaseOrderItems(id)
  const { data: linkedInvoices = [], isLoading: isInvoicesLoading } =
    usePurchaseOrderInvoices(id)

  const linkedInvoiceIds = useMemo(
    () => linkedInvoices.map((inv) => inv.id),
    [linkedInvoices]
  )

  const recentLinkedInvoices = useMemo(
    () => linkedInvoices.slice(0, 5),
    [linkedInvoices]
  )

  const linkedInvoicedTotal = useMemo(
    () => linkedInvoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    [linkedInvoices]
  )

  if (isDetailsLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (detailsError || !po) {
    return (
      <div className="space-y-8">
        <PageBreadcrumb
          items={[
            { label: "Dashboard", to: getDashboardPath() },
            { label: "Billings", to: "/invoices" },
            { label: "Purchase orders", to: "/purchase-orders" },
            { label: "Purchase order" },
          ]}
        />
        <EmptyState
          icon={<HelpCircle className="h-6 w-6 text-destructive" />}
          title="Purchase order not found"
          description="The requested purchase order details could not be loaded."
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate("/purchase-orders")}>
              Back to purchase orders
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", to: getDashboardPath() },
          { label: "Billings", to: "/invoices" },
          { label: "Purchase orders", to: "/purchase-orders" },
          { label: `PO #${po.po_number}` },
        ]}
      />

      <PageHeader
        title={`PO #${po.po_number}`}
        meta={
          po.customer ? (
            <Link
              to={`/customers/${po.customer_id}`}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {po.customer.customer_name}
            </Link>
          ) : undefined
        }
        actions={<PurchaseOrderStatusBadge status={po.status} />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Line items</TabsTrigger>
          <TabsTrigger value="invoices">
            Linked invoices
            {linkedInvoices.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                {linkedInvoices.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <ClipboardList className="h-4 w-4 text-primary" aria-hidden />
                  PO summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-sm leading-relaxed">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">PO date</span>
                  <span className="font-medium text-foreground">
                    {new Date(po.po_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium text-foreground">{po.currency}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {formatCurrency(po.subtotal_amount)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {formatCurrency(po.tax_amount)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-3">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(po.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Invoiced</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {isInvoicesLoading
                      ? "…"
                      : `${formatCurrency(linkedInvoicedTotal)} of ${formatCurrency(po.total_amount)}`}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <User className="h-4 w-4 text-primary" aria-hidden />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-sm leading-relaxed">
                {po.customer ? (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Name</span>
                      <Link
                        to={`/customers/${po.customer_id}`}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {po.customer.customer_name}
                      </Link>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Customer code</span>
                      <span className="font-mono text-xs font-medium text-foreground">
                        {po.customer.customer_code}
                      </span>
                    </div>
                    {po.customer.email && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Email</span>
                        <span className="font-medium text-foreground">{po.customer.email}</span>
                      </div>
                    )}
                    {po.customer.phone && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium text-foreground">{po.customer.phone}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">Customer details unavailable</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Link2 className="h-4 w-4 text-primary" aria-hidden />
                Linked invoices
                {linkedInvoices.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({linkedInvoices.length})
                  </span>
                )}
              </CardTitle>
              {linkedInvoices.length > 5 && (
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("invoices")}>
                  View all
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <LinkedInvoicesTable
                invoices={recentLinkedInvoices}
                isLoading={isInvoicesLoading}
                onRowClick={(invoiceId) => navigate(`/invoices/${invoiceId}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <FileSpreadsheet className="h-4 w-4 text-primary" aria-hidden />
                Line items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-0">
              {isItemsLoading ? (
                <div className="space-y-3 p-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : items.length === 0 ? (
                <EmptyState
                  title="No line items"
                  description="This purchase order has no line items to display."
                  className="py-8"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit price</TableHead>
                      <TableHead className="text-right">Line total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-foreground">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {item.quantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-foreground">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="border-t border-border px-4 py-4">
                <div className="ml-auto w-full max-w-sm space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatCurrency(po.subtotal_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatCurrency(po.tax_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-3">
                    <span className="font-semibold text-foreground">Total PO amount</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatCurrency(po.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Calendar className="h-4 w-4 text-primary" aria-hidden />
                Linked invoices
              </CardTitle>
              <Button variant="secondary" size="sm" onClick={() => setLinkDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Link invoice
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <LinkedInvoicesTable
                invoices={linkedInvoices}
                isLoading={isInvoicesLoading}
                onRowClick={(invoiceId) => navigate(`/invoices/${invoiceId}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LinkInvoiceDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        purchaseOrder={po}
        linkedInvoiceIds={linkedInvoiceIds}
      />
    </div>
  )
}

export default PurchaseOrderDetailPage
