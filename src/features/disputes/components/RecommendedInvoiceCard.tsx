import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface RecommendedInvoiceCardProps {
  invoice: Record<string, unknown>
}

const currency = (value: unknown) => {
  if (typeof value === "number") {
    return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return "—"
}

const pick = (invoice: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = invoice[key]
    if (value != null && value !== "") return value
  }
  return null
}

const formatDate = (value: unknown) => {
  if (!value) return "—"
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleDateString()
}

export const RecommendedInvoiceCard: React.FC<RecommendedInvoiceCardProps> = ({
  invoice,
}) => {
  const items = Array.isArray(invoice.items) ? invoice.items : []
  const invoiceNumber = pick(invoice, ["invoice_number", "invoiceNumber"])
  const customerName = pick(invoice, ["customer_name", "customerName"])
  const issueDate = pick(invoice, ["invoice_date", "issue_date", "invoiceDate"])
  const dueDate = pick(invoice, ["due_date", "dueDate"])
  const subtotal = pick(invoice, ["subtotal_amount", "subtotal"])
  const tax = pick(invoice, ["tax_amount", "tax", "tax_total"])
  const total = pick(invoice, ["total_amount", "total"])
  const outstanding = pick(invoice, ["outstanding_amount", "outstanding"])

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card text-sm">
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">
          Recommended invoice changes
        </p>
        <p className="mt-0.5 text-base font-semibold text-foreground">
          {invoiceNumber ? String(invoiceNumber) : "Invoice amendment"}
        </p>
        {customerName && (
          <p className="mt-0.5 text-sm text-muted-foreground">{String(customerName)}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 lg:grid-cols-4">
        <div>
          <span className="block text-xs text-muted-foreground">Invoice number</span>
          <span className="font-medium">{invoiceNumber ? String(invoiceNumber) : "—"}</span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Issue date</span>
          <span className="font-medium">{formatDate(issueDate)}</span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Due date</span>
          <span className="font-medium">{formatDate(dueDate)}</span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Subtotal</span>
          <span className="font-medium tabular-nums">{currency(subtotal)}</span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Tax</span>
          <span className="font-medium tabular-nums">{currency(tax)}</span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Total</span>
          <span className="font-semibold tabular-nums text-success">{currency(total)}</span>
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Outstanding</span>
          <span className="font-medium tabular-nums">{currency(outstanding)}</span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Line items</p>
        {items.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => {
                  const row = item as Record<string, unknown>
                  const description =
                    pick(row, ["description", "product_name", "name", "product"]) || "Item"
                  const quantity = pick(row, ["quantity", "qty"])
                  const unitPrice = pick(row, ["unit_price", "rate", "price"])
                  const amount = pick(row, ["amount", "total", "line_total"])

                  return (
                    <TableRow key={index}>
                      <TableCell>{String(description)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {quantity != null ? String(quantity) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {currency(unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {currency(amount)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">No line items provided.</p>
        )}
      </div>
    </div>
  )
}
