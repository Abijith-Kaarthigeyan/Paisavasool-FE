import React, { useEffect, useState } from "react"

export type EditableInvoiceData = {
  invoice_number?: string
  customer_name?: string
  invoice_date?: string
  due_date?: string
  subtotal_amount: number
  tax_amount: number
  total_amount: number
  outstanding_amount?: number
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    amount: number
  }>
}

interface EditableRecommendedInvoiceFormProps {
  initialInvoice: Record<string, unknown>
  onChange: (invoice: EditableInvoiceData) => void
}

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const toEditable = (invoice: Record<string, unknown>): EditableInvoiceData => {
  const rawItems = Array.isArray(invoice.items) ? invoice.items : []
  const items = rawItems.map((item) => {
    const row = item as Record<string, unknown>
    const quantity = toNumber(row.quantity, 0)
    const unitPrice = toNumber(row.unit_price ?? row.rate, 0)
    const amount = toNumber(row.amount ?? row.line_total, quantity * unitPrice)
    return {
      description: String(row.description ?? row.product_name ?? ""),
      quantity,
      unit_price: unitPrice,
      amount,
    }
  })

  return {
    invoice_number: String(invoice.invoice_number ?? invoice.invoiceNumber ?? ""),
    customer_name: String(invoice.customer_name ?? invoice.customerName ?? ""),
    invoice_date: String(invoice.invoice_date ?? invoice.issue_date ?? ""),
    due_date: String(invoice.due_date ?? ""),
    subtotal_amount: toNumber(invoice.subtotal_amount ?? invoice.subtotal, 0),
    tax_amount: toNumber(invoice.tax_amount ?? invoice.tax, 0),
    total_amount: toNumber(invoice.total_amount ?? invoice.total, 0),
    outstanding_amount: toNumber(invoice.outstanding_amount ?? invoice.outstanding, 0),
    items,
  }
}

export const EditableRecommendedInvoiceForm: React.FC<
  EditableRecommendedInvoiceFormProps
> = ({ initialInvoice, onChange }) => {
  const [form, setForm] = useState<EditableInvoiceData>(() => toEditable(initialInvoice))

  useEffect(() => {
    setForm(toEditable(initialInvoice))
  }, [initialInvoice])

  useEffect(() => {
    onChange(form)
  }, [form, onChange])

  const updateItem = (index: number, patch: Partial<EditableInvoiceData["items"][0]>) => {
    setForm((prev) => {
      const items = [...prev.items]
      const current = { ...items[index], ...patch }
      if (patch.quantity != null || patch.unit_price != null) {
        current.amount = Number((current.quantity * current.unit_price).toFixed(2))
      }
      items[index] = current
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
      const tax = prev.tax_amount
      return {
        ...prev,
        items,
        subtotal_amount: Number(subtotal.toFixed(2)),
        total_amount: Number((subtotal + tax).toFixed(2)),
      }
    })
  }

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <label className="space-y-1">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Issue Date</span>
          <input
            type="date"
            value={(form.invoice_date || "").slice(0, 10)}
            onChange={(e) => setForm((p) => ({ ...p, invoice_date: e.target.value }))}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Due Date</span>
          <input
            type="date"
            value={(form.due_date || "").slice(0, 10)}
            onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Subtotal</span>
          <input
            type="number"
            step="0.01"
            value={form.subtotal_amount}
            onChange={(e) => {
              const subtotal = toNumber(e.target.value)
              setForm((p) => ({
                ...p,
                subtotal_amount: subtotal,
                total_amount: Number((subtotal + p.tax_amount).toFixed(2)),
              }))
            }}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Tax</span>
          <input
            type="number"
            step="0.01"
            value={form.tax_amount}
            onChange={(e) => {
              const tax = toNumber(e.target.value)
              setForm((p) => ({
                ...p,
                tax_amount: tax,
                total_amount: Number((p.subtotal_amount + tax).toFixed(2)),
              }))
            }}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-zinc-900/40 text-[10px] uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-bold">Description</th>
              <th className="px-3 py-2 font-bold text-right">Qty</th>
              <th className="px-3 py-2 font-bold text-right">Unit Price</th>
              <th className="px-3 py-2 font-bold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {form.items.map((item, index) => (
              <tr key={index} className="border-t border-border">
                <td className="px-3 py-2">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                    className="w-full rounded border border-input bg-background px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: toNumber(e.target.value) })}
                    className="w-full rounded border border-input bg-background px-2 py-1 text-right font-mono"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, { unit_price: toNumber(e.target.value) })}
                    className="w-full rounded border border-input bg-background px-2 py-1 text-right font-mono"
                  />
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold">
                  ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end font-bold text-emerald-600">
        Total: ₹{form.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </div>
    </div>
  )
}
