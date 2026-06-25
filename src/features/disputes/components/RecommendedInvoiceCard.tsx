import React from "react"

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
    <div className="rounded-lg border border-border bg-white dark:bg-zinc-950/20 overflow-hidden text-xs">
      <div className="px-4 py-3 border-b border-border bg-slate-50/80 dark:bg-zinc-900/40">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Recommended Invoice Changes
        </p>
        <p className="font-bold text-foreground text-sm mt-0.5">
          {invoiceNumber ? String(invoiceNumber) : "Invoice amendment"}
        </p>
        {customerName && (
          <p className="text-muted-foreground mt-0.5">{String(customerName)}</p>
        )}
      </div>

      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <div>
          <span className="text-muted-foreground block text-[10px]">Invoice Number</span>
          <span className="font-semibold">{invoiceNumber ? String(invoiceNumber) : "—"}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px]">Issue Date</span>
          <span className="font-semibold">{formatDate(issueDate)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px]">Due Date</span>
          <span className="font-semibold">{formatDate(dueDate)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px]">Subtotal</span>
          <span className="font-mono font-semibold">{currency(subtotal)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px]">Tax</span>
          <span className="font-mono font-semibold">{currency(tax)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px]">Total</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {currency(total)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px]">Outstanding</span>
          <span className="font-mono font-semibold">{currency(outstanding)}</span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Products / Line Items
        </p>
        {items.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/40 text-[10px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-bold">Product</th>
                  <th className="px-3 py-2 font-bold text-right">Quantity</th>
                  <th className="px-3 py-2 font-bold text-right">Unit Price</th>
                  <th className="px-3 py-2 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const row = item as Record<string, unknown>
                  const description =
                    pick(row, ["description", "product_name", "name", "product"]) ||
                    "Item"
                  const quantity = pick(row, ["quantity", "qty"])
                  const unitPrice = pick(row, ["unit_price", "rate", "price"])
                  const amount = pick(row, ["amount", "total", "line_total"])

                  return (
                    <tr key={index} className="border-t border-border">
                      <td className="px-3 py-2 text-foreground">{String(description)}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {quantity != null ? String(quantity) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {currency(unitPrice)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">
                        {currency(amount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground italic">No line items provided.</p>
        )}
      </div>
    </div>
  )
}
