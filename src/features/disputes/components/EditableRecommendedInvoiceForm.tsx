import React, { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

/** Invoice line quantities are always whole units (no fractional qty). */
const toIntegerQuantity = (value: unknown, fallback = 0) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(0, Math.round(n))
}

const toEditable = (invoice: Record<string, unknown>): EditableInvoiceData => {
  const rawItems = Array.isArray(invoice.items) ? invoice.items : []
  const items = rawItems.map((item) => {
    const row = item as Record<string, unknown>
    const quantity = toIntegerQuantity(row.quantity, 0)
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

const changedFieldClass =
  "border-warning/40 bg-warning-muted/40 ring-1 ring-warning/20"

export const EditableRecommendedInvoiceForm: React.FC<
  EditableRecommendedInvoiceFormProps
> = ({ initialInvoice, onChange }) => {
  const original = useMemo(() => toEditable(initialInvoice), [initialInvoice])
  const [form, setForm] = useState<EditableInvoiceData>(() => toEditable(initialInvoice))

  useEffect(() => {
    setForm(toEditable(initialInvoice))
  }, [initialInvoice])

  useEffect(() => {
    onChange(form)
  }, [form, onChange])

  const isFieldChanged = (key: keyof EditableInvoiceData, value: unknown) => {
    const originalValue = original[key]
    if (key === "items") return false
    return String(originalValue ?? "") !== String(value ?? "")
  }

  const isItemFieldChanged = (
    index: number,
    field: keyof EditableInvoiceData["items"][0],
    value: unknown
  ) => {
    const originalItem = original.items[index]
    if (!originalItem) return false
    return String(originalItem[field]) !== String(value)
  }

  const updateItem = (index: number, patch: Partial<EditableInvoiceData["items"][0]>) => {
    setForm((prev) => {
      const items = [...prev.items]
      const normalizedPatch = { ...patch }
      if (patch.quantity != null) {
        normalizedPatch.quantity = toIntegerQuantity(patch.quantity)
      }
      const current = { ...items[index], ...normalizedPatch }
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
    <div className="space-y-4 text-sm">
      <p className="text-xs text-muted-foreground">
        Fields highlighted in amber differ from the agent&apos;s original recommendation.
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-issue-date">Issue date</Label>
          <Input
            id="edit-issue-date"
            type="date"
            value={(form.invoice_date || "").slice(0, 10)}
            onChange={(e) => setForm((p) => ({ ...p, invoice_date: e.target.value }))}
            className={cn(
              isFieldChanged("invoice_date", form.invoice_date) && changedFieldClass
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-due-date">Due date</Label>
          <Input
            id="edit-due-date"
            type="date"
            value={(form.due_date || "").slice(0, 10)}
            onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
            className={cn(isFieldChanged("due_date", form.due_date) && changedFieldClass)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-subtotal">Subtotal</Label>
          <Input
            id="edit-subtotal"
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
            className={cn(
              "tabular-nums",
              isFieldChanged("subtotal_amount", form.subtotal_amount) && changedFieldClass
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-tax">Tax</Label>
          <Input
            id="edit-tax"
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
            className={cn(
              "tabular-nums",
              isFieldChanged("tax_amount", form.tax_amount) && changedFieldClass
            )}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {form.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                    className={cn(
                      isItemFieldChanged(index, "description", item.description) &&
                        changedFieldClass
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    inputMode="numeric"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, { quantity: toIntegerQuantity(e.target.value) })
                    }
                    className={cn(
                      "text-right tabular-nums",
                      isItemFieldChanged(index, "quantity", item.quantity) && changedFieldClass
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, { unit_price: toNumber(e.target.value) })}
                    className={cn(
                      "text-right tabular-nums",
                      isItemFieldChanged(index, "unit_price", item.unit_price) &&
                        changedFieldClass
                    )}
                  />
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(item.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end text-sm font-semibold tabular-nums text-success">
        Total: {formatCurrency(form.total_amount)}
      </div>
    </div>
  )
}
