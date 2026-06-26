import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { Invoice, InvoiceItem } from "@/features/invoices/types"
import {
  computeInvoiceDiff,
  formatInvoiceCurrency,
  normalizeInvoiceFromDispute,
  normalizeInvoiceFromRecord,
  type LineItemChangeStatus,
} from "../utils/computeInvoiceDiff"
import type { EditableInvoiceData } from "@/features/disputes/components/EditableRecommendedInvoiceForm"

interface InvoiceAmendmentDiffProps {
  dispute?: { invoice?: Partial<Invoice>; invoice_number?: string }
  invoiceItems?: InvoiceItem[]
  currentInvoice?: Record<string, unknown>
  proposedInvoice: Record<string, unknown>
  editedInvoice?: EditableInvoiceData | null
  className?: string
  showUnchangedLineItems?: boolean
  emptyMessage?: string
}

const changedRowClass = "border-warning/40 bg-warning-muted/40"

const statusBadgeVariant: Record<
  LineItemChangeStatus,
  "neutral" | "warning" | "success" | "destructive" | "outline"
> = {
  unchanged: "neutral",
  modified: "warning",
  added: "success",
  removed: "destructive",
}

const statusLabel: Record<LineItemChangeStatus, string> = {
  unchanged: "Unchanged",
  modified: "Modified",
  added: "Added",
  removed: "Removed",
}

function editableToRecord(invoice: EditableInvoiceData): Record<string, unknown> {
  return {
    invoice_number: invoice.invoice_number,
    customer_name: invoice.customer_name,
    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date,
    subtotal_amount: invoice.subtotal_amount,
    tax_amount: invoice.tax_amount,
    total_amount: invoice.total_amount,
    outstanding_amount: invoice.outstanding_amount,
    items: invoice.items,
  }
}

export function InvoiceAmendmentDiff({
  dispute,
  invoiceItems = [],
  currentInvoice,
  proposedInvoice,
  editedInvoice,
  className,
  showUnchangedLineItems = false,
  emptyMessage = "No invoice changes proposed.",
}: InvoiceAmendmentDiffProps) {
  const diff = useMemo(() => {
    const current = currentInvoice
      ? normalizeInvoiceFromRecord(currentInvoice)
      : normalizeInvoiceFromDispute(
          dispute?.invoice,
          invoiceItems,
          dispute?.invoice_number
        )
    const proposedSource = editedInvoice ? editableToRecord(editedInvoice) : proposedInvoice
    const proposed = normalizeInvoiceFromRecord(proposedSource)
    return computeInvoiceDiff(current, proposed)
  }, [currentInvoice, dispute, invoiceItems, proposedInvoice, editedInvoice])

  const visibleLineItems = showUnchangedLineItems
    ? diff.lineItemDiffs
    : diff.lineItemDiffs.filter((item) => item.status !== "unchanged")

  const changedFields = diff.fieldDiffs.filter((field) => field.changed)

  if (!diff.hasChanges) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {diff.summaryChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {diff.summaryChips.map((chip) => (
            <Badge key={chip} variant="warning" shape="pill">
              {chip}
            </Badge>
          ))}
        </div>
      )}

      {changedFields.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Proposed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changedFields.map((field) => (
                <TableRow key={field.field} className={changedRowClass}>
                  <TableCell className="font-medium">{field.label}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {field.current}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums text-foreground">
                    {field.proposed}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {visibleLineItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Line items</p>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleLineItems.map((item, index) => {
                  const row = item.proposed ?? item.current
                  const isChanged = item.status !== "unchanged"
                  return (
                    <TableRow
                      key={`${item.description}-${index}`}
                      className={cn(isChanged && changedRowClass)}
                    >
                      <TableCell>
                        <Badge variant={statusBadgeVariant[item.status]} shape="pill">
                          {statusLabel[item.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium">{row?.description ?? "—"}</p>
                          {item.status === "modified" && item.current && item.proposed && (
                            <p className="text-xs text-muted-foreground">
                              Was: {item.current.quantity} ×{" "}
                              {formatInvoiceCurrency(item.current.unit_price)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row?.quantity ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row ? formatInvoiceCurrency(row.unit_price) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {row ? formatInvoiceCurrency(row.amount) : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
