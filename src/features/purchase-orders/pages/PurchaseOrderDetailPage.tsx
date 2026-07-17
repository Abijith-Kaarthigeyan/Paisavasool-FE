import React, { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  usePurchaseOrderDetails,
  usePurchaseOrderItems,
  usePurchaseOrderInvoices,
  usePurchaseOrderGrns,
} from "../hooks/usePurchaseOrders"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/toast"
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
  FileText,
  Link2,
  ClipboardList,
  Loader2,
  PackageCheck,
  Plus,
} from "lucide-react"
import { PurchaseOrderStatusBadge } from "../components/PurchaseOrderStatusBadge"
import { LinkInvoiceDialog } from "../components/LinkInvoiceDialog"
import { LinkGrnDialog } from "../components/LinkGrnDialog"
import { purchaseOrderService } from "../services/purchaseOrderService"
import { grnService } from "@/features/grn/services/grnService"
import type { GoodsReceiptNote, GrnStatus } from "@/features/grn/types"
import type { Invoice } from "@/features/invoices/types"

const getDisplayInvoiceStatus = (invoice: Invoice): string => {
  if (invoice.status !== "OVERDUE") {
    return invoice.status
  }
  return invoice.outstanding_amount >= invoice.total_amount
    ? "PENDING"
    : "PARTIALLY_PAID"
}

function grnStatusVariant(status: GrnStatus): "success" | "warning" | "destructive" | "outline" {
  if (status === "LINKED") return "success"
  if (status === "UNLINKED") return "warning"
  if (status === "FAILED") return "destructive"
  return "outline"
}

function truncateNotes(notes: string | null, maxLength = 80): string {
  if (!notes) return "—"
  const trimmed = notes.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength).trimEnd()}…`
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

function LinkedGrnsTable({
  grns,
  isLoading,
  openingPdfGrnId,
  onViewPdf,
  onGoToUpload,
  onRowClick,
}: {
  grns: GoodsReceiptNote[]
  isLoading: boolean
  openingPdfGrnId: string | null
  onViewPdf: (grn: GoodsReceiptNote) => void
  onGoToUpload: () => void
  onRowClick: (grnId: string) => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (grns.length === 0) {
    return (
      <EmptyState
        title="No goods receipt notes"
        description="No goods receipt notes linked to this PO yet. Upload a GRN via Global Upload."
        className="py-8"
        action={
          <Button variant="ghost" size="sm" onClick={onGoToUpload}>
            Go to Global Upload
          </Button>
        }
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>GRN number</TableHead>
          <TableHead>GRN date</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {grns.map((grn) => {
          const isOpeningPdf = openingPdfGrnId === grn.id
          return (
            <TableRow
              key={grn.id}
              className="cursor-pointer"
              onClick={() => onRowClick(grn.id)}
            >
              <TableCell className="font-medium text-foreground">
                {grn.grn_number}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(grn.grn_date).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={grnStatusVariant(grn.status)} shape="pill">
                  {grn.status}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs text-muted-foreground">
                {truncateNotes(grn.notes)}
              </TableCell>
              <TableCell className="text-right">
                {grn.has_source_pdf ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewPdf(grn)
                    }}
                    disabled={isOpeningPdf}
                  >
                    {isOpeningPdf ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    View PDF
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">No PDF</span>
                )}
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
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkGrnDialogOpen, setLinkGrnDialogOpen] = useState(false)
  const [isOpeningSourcePdf, setIsOpeningSourcePdf] = useState(false)
  const [openingPdfGrnId, setOpeningPdfGrnId] = useState<string | null>(null)

  const { data: po, isLoading: isDetailsLoading, error: detailsError } =
    usePurchaseOrderDetails(id)
  const { data: items = [], isLoading: isItemsLoading } = usePurchaseOrderItems(id)
  const { data: linkedInvoices = [], isLoading: isInvoicesLoading } =
    usePurchaseOrderInvoices(id)
  const { data: linkedGrns = [], isLoading: isGrnsLoading } = usePurchaseOrderGrns(id)

  const linkedInvoiceIds = useMemo(
    () => linkedInvoices.map((inv) => inv.id),
    [linkedInvoices]
  )

  const linkedGrnIds = useMemo(
    () => linkedGrns.map((grn) => grn.id),
    [linkedGrns]
  )

  const recentLinkedInvoices = useMemo(
    () => linkedInvoices.slice(0, 5),
    [linkedInvoices]
  )

  const linkedInvoicedTotal = useMemo(
    () => linkedInvoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    [linkedInvoices]
  )

  const handleOpenSourcePdf = () => {
    if (!po?.id || !po.has_source_pdf || isOpeningSourcePdf) {
      return
    }

    const previewTab = window.open("about:blank", "_blank")
    setIsOpeningSourcePdf(true)

    purchaseOrderService
      .openSourcePdfInTab(previewTab, po.id, `PO-${po.po_number}.pdf`)
      .catch((error) => {
        if (previewTab && !previewTab.closed) {
          previewTab.close()
        }
        toast({
          title: "Could not open source PDF",
          description: "Failed to load the original purchase order PDF.",
          type: "error",
        })
        console.error(error)
      })
      .finally(() => {
        setIsOpeningSourcePdf(false)
      })
  }

  const handleOpenGrnPdf = (grn: GoodsReceiptNote) => {
    if (!grn.has_source_pdf || openingPdfGrnId) {
      return
    }

    const previewTab = window.open("about:blank", "_blank")
    setOpeningPdfGrnId(grn.id)

    grnService
      .openSourcePdfInTab(
        previewTab,
        grn.id,
        grn.source_file_name ?? `GRN-${grn.grn_number}.pdf`
      )
      .catch((error) => {
        if (previewTab && !previewTab.closed) {
          previewTab.close()
        }
        toast({
          title: "Could not open GRN PDF",
          description: "Failed to load the goods receipt note PDF.",
          type: "error",
        })
        console.error(error)
      })
      .finally(() => {
        setOpeningPdfGrnId(null)
      })
  }

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
            { label: "Receivables", to: "/invoices" },
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
          { label: "Receivables", to: "/invoices" },
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
        actions={
          <div className="flex items-center gap-2">
            <PurchaseOrderStatusBadge status={po.status} />
            {po.has_source_pdf && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenSourcePdf}
                disabled={isOpeningSourcePdf}
              >
                {isOpeningSourcePdf ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                )}
                Source Pdf
              </Button>
            )}
          </div>
        }
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
          <TabsTrigger value="grns">
            GRNs
            {linkedGrns.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                {linkedGrns.length}
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

        <TabsContent value="grns">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <PackageCheck className="h-4 w-4 text-primary" aria-hidden />
                Goods receipt notes
              </CardTitle>
              <Button variant="secondary" size="sm" onClick={() => setLinkGrnDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Link GRN
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <LinkedGrnsTable
                grns={linkedGrns}
                isLoading={isGrnsLoading}
                openingPdfGrnId={openingPdfGrnId}
                onViewPdf={handleOpenGrnPdf}
                onGoToUpload={() => navigate("/upload")}
                onRowClick={(grnId) => navigate(`/grns/${grnId}`)}
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
      <LinkGrnDialog
        open={linkGrnDialogOpen}
        onOpenChange={setLinkGrnDialogOpen}
        purchaseOrder={po}
        linkedGrnIds={linkedGrnIds}
      />
    </div>
  )
}

export default PurchaseOrderDetailPage
