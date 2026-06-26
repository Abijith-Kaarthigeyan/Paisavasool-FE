import React, { useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  useInvoiceDetails,
  useInvoiceItems,
  useInvoiceVersions,
  useInvoiceVersion,
} from "../hooks/useInvoices"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
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
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  HelpCircle,
  FileSpreadsheet,
  History,
} from "lucide-react"

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedVersion, setSelectedVersion] = useState<number | "current">("current")
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false)

  const { data: invoice, isLoading: isDetailsLoading, error: detailsError } = useInvoiceDetails(id)
  const { data: liveItems = [], isLoading: isItemsLoading } = useInvoiceItems(id)
  const { data: versions = [] } = useInvoiceVersions(id)

  const viewingHistorical =
    selectedVersion !== "current" && selectedVersion !== invoice?.current_version

  const { data: historicalVersion, isLoading: isHistoricalLoading } = useInvoiceVersion(
    id,
    viewingHistorical ? (selectedVersion as number) : null
  )

  const displaySnapshot = useMemo(() => {
    if (!viewingHistorical || !historicalVersion) return null
    return historicalVersion.invoice_snapshot
  }, [viewingHistorical, historicalVersion])

  const displayItems = useMemo(() => {
    if (viewingHistorical && historicalVersion) {
      return historicalVersion.items_snapshot.map((item, index) => ({
        id: `hist-${index}`,
        invoice_id: id || "",
        description: String(item.description ?? ""),
        quantity: Number(item.quantity ?? 0),
        unit_price: Number(item.unit_price ?? 0),
        amount: Number(item.amount ?? 0),
        created_at: historicalVersion.created_at || "",
      }))
    }
    return liveItems
  }, [viewingHistorical, historicalVersion, liveItems, id])

  const headerInvoiceNumber = viewingHistorical
    ? String(displaySnapshot?.invoice_number ?? invoice?.invoice_number)
    : invoice?.invoice_number

  const headerStatus = viewingHistorical
    ? String(displaySnapshot?.status ?? "HISTORICAL")
    : invoice?.status

  const subtotal = viewingHistorical
    ? Number(displaySnapshot?.subtotal_amount ?? 0)
    : invoice?.subtotal_amount ?? 0

  const tax = viewingHistorical
    ? Number(displaySnapshot?.tax_amount ?? 0)
    : invoice?.tax_amount ?? 0

  const total = viewingHistorical
    ? Number(displaySnapshot?.total_amount ?? 0)
    : invoice?.total_amount ?? 0

  const outstanding = viewingHistorical
    ? Number(displaySnapshot?.outstanding_amount ?? 0)
    : invoice?.outstanding_amount ?? 0

  const invoiceDate = viewingHistorical
    ? String(displaySnapshot?.invoice_date ?? "")
    : invoice?.invoice_date ?? ""

  const dueDate = viewingHistorical
    ? String(displaySnapshot?.due_date ?? "")
    : invoice?.due_date ?? ""

  if (isDetailsLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (detailsError || !invoice) {
    return (
      <div className="mx-auto max-w-md py-16">
        <EmptyState
          icon={<HelpCircle className="h-6 w-6 text-destructive" />}
          title="Invoice not found"
          description="The requested invoice details could not be loaded."
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
              Back to invoices
            </Button>
          }
        />
      </div>
    )
  }

  const currentVersion = invoice.current_version ?? 1
  const latestVersionEntry = versions.reduce<typeof versions[number] | undefined>(
    (latest, version) =>
      !latest || version.version_number > latest.version_number ? version : latest,
    undefined
  )

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageBreadcrumb
        items={[
          { label: "Invoices", to: "/invoices" },
          { label: `Invoice #${headerInvoiceNumber}` },
        ]}
      />

      <PageHeader
        title={`Invoice #${headerInvoiceNumber}`}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" shape="pill">
              Version {viewingHistorical ? selectedVersion : currentVersion}
            </Badge>
            {viewingHistorical && (
              <Badge variant="warning" shape="pill">
                Historical view
              </Badge>
            )}
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {versions.length > 0 && (
              <div className="w-36 space-y-1">
                <Label htmlFor="version-select" className="sr-only">
                  Version
                </Label>
                <Select
                  id="version-select"
                  value={
                    selectedVersion === "current"
                      ? String(currentVersion)
                      : String(selectedVersion)
                  }
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setSelectedVersion(val === currentVersion ? "current" : val)
                  }}
                >
                  {versions.map((v) => (
                    <option key={v.version_number} value={v.version_number}>
                      v{v.version_number}
                      {v.is_current ? " (current)" : ""}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <Badge
              variant={getStatusVariant(INVOICE_STATUS_VARIANT, headerStatus)}
              shape="pill"
            >
              {headerStatus?.replace(/_/g, " ")}
            </Badge>
          </div>
        }
      />

      {versions.length > 1 && (
        <Card>
          <button
            type="button"
            onClick={() => setIsHistoryExpanded((open) => !open)}
            aria-expanded={isHistoryExpanded}
            className="flex w-full items-center justify-between gap-3 border-b border-border px-6 py-4 text-left transition-colors hover:bg-muted/40"
          >
            <div className="min-w-0 space-y-1">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <History className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                Amendment history
              </CardTitle>
              {!isHistoryExpanded && (
                <p className="text-sm text-muted-foreground">
                  {versions.length} versions
                  {latestVersionEntry?.created_at && (
                    <>
                      {" "}
                      · Latest change{" "}
                      {new Date(latestVersionEntry.created_at).toLocaleDateString()}
                    </>
                  )}
                </p>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
              {isHistoryExpanded ? (
                <>
                  Hide
                  <ChevronUp className="h-4 w-4" aria-hidden />
                </>
              ) : (
                <>
                  Show all
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </>
              )}
            </span>
          </button>
          {isHistoryExpanded && (
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((v) => (
                    <TableRow
                      key={v.version_number}
                      className="cursor-pointer"
                      onClick={() =>
                        setSelectedVersion(v.is_current ? "current" : v.version_number)
                      }
                    >
                      <TableCell className="font-medium tabular-nums">
                        v{v.version_number}
                        {v.is_current ? " *" : ""}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(v.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>{v.change_reason || "—"}</TableCell>
                      <TableCell>{v.change_source}</TableCell>
                      <TableCell>{v.created_by || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Calendar className="h-4 w-4 text-primary" aria-hidden />
              Invoice schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-sm leading-relaxed">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Invoice date</span>
              <span className="font-medium text-foreground">
                {invoiceDate ? new Date(invoiceDate).toLocaleDateString() : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Due date</span>
              <span className="font-medium text-foreground">
                {dueDate ? new Date(dueDate).toLocaleDateString() : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <User className="h-4 w-4 text-primary" aria-hidden />
              Customer account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-sm leading-relaxed">
            {invoice.customer ? (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium text-foreground">
                    {invoice.customer.customer_name}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Customer code</span>
                  <span className="font-mono text-xs font-medium text-foreground">
                    {invoice.customer.customer_code}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Billing currency</span>
                <span className="font-medium text-foreground">INR (₹)</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <FileSpreadsheet className="h-4 w-4 text-primary" aria-hidden />
            Line items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-0">
          {isItemsLoading || (viewingHistorical && isHistoricalLoading) ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : displayItems.length === 0 ? (
            <EmptyState
              title="No line items"
              description="This invoice has no line items to display."
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
                {displayItems.map((item) => (
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
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes</span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatCurrency(tax)}
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-3">
                <span className="font-semibold text-foreground">Total invoice amount</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatCurrency(total)}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-semibold text-destructive">Outstanding</span>
                <span className="font-semibold tabular-nums text-destructive">
                  {formatCurrency(outstanding)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default InvoiceDetailPage
