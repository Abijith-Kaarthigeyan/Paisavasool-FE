import { useMemo, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/formatCurrency"
import type { Invoice } from "@/features/invoices/types"
import type { PurchaseOrder, PurchaseOrderItem } from "../types"

interface CompareField {
  label: string
  poValue: string
  invoiceValue: string
  matches: boolean
}

interface PoInvoiceCompareTableProps {
  purchaseOrder: PurchaseOrder
  poItems: PurchaseOrderItem[]
  invoice: Partial<Invoice>
  invoiceItemCount: number
  className?: string
}

const mismatchRowClass = "border-warning/40 bg-warning-muted/40"

function formatDate(value: string | undefined | null): string {
  if (!value) return "—"
  return new Date(value).toLocaleDateString()
}

export function PoInvoiceCompareTable({
  purchaseOrder,
  poItems,
  invoice,
  invoiceItemCount,
  className,
}: PoInvoiceCompareTableProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const fields = useMemo<CompareField[]>(() => {
    const poTotal = purchaseOrder.total_amount
    const invoiceTotal = invoice.total_amount
    const poDate = purchaseOrder.po_date
    const invoiceDate = invoice.invoice_date

    return [
      {
        label: "Total amount",
        poValue:
          poTotal != null ? formatCurrency(poTotal) : "—",
        invoiceValue:
          invoiceTotal != null ? formatCurrency(invoiceTotal) : "—",
        matches:
          poTotal != null &&
          invoiceTotal != null &&
          Math.abs(poTotal - invoiceTotal) < 0.01,
      },
      {
        label: "Date",
        poValue: formatDate(poDate),
        invoiceValue: formatDate(invoiceDate),
        matches:
          !!poDate &&
          !!invoiceDate &&
          new Date(poDate).toDateString() === new Date(invoiceDate).toDateString(),
      },
      {
        label: "Line items",
        poValue: String(poItems.length),
        invoiceValue: String(invoiceItemCount),
        matches: poItems.length === invoiceItemCount,
      },
    ]
  }, [purchaseOrder, poItems.length, invoice, invoiceItemCount])

  const mismatchCount = fields.filter((field) => !field.matches).length
  const hasMismatches = mismatchCount > 0

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-full justify-between px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => setIsExpanded((value) => !value)}
      >
        <span className="flex items-center gap-2">
          PO vs invoice comparison
          {hasMismatches ? (
            <Badge variant="warning" shape="pill" className="text-[10px]">
              {mismatchCount} mismatch{mismatchCount === 1 ? "" : "es"}
            </Badge>
          ) : (
            <Badge variant="success" shape="pill" className="text-[10px]">
              Aligned
            </Badge>
          )}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")}
          aria-hidden
        />
      </Button>

      {isExpanded && (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Field</TableHead>
                <TableHead className="text-xs">PO</TableHead>
                <TableHead className="text-xs">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field) => (
                <TableRow
                  key={field.label}
                  className={cn(!field.matches && mismatchRowClass)}
                >
                  <TableCell className="text-xs font-medium">{field.label}</TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">
                    {field.poValue}
                  </TableCell>
                  <TableCell className="text-xs font-medium tabular-nums text-foreground">
                    {field.invoiceValue}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            Differences are shown for review only — no automatic changes are applied.
          </p>
        </div>
      )}
    </div>
  )
}
