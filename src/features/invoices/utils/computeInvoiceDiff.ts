import type { Invoice, InvoiceItem } from "@/features/invoices/types"
import { formatCurrency, formatCurrencyDelta } from "@/lib/formatCurrency"

export { formatCurrency as formatInvoiceCurrency } from "@/lib/formatCurrency"

export type NormalizedLineItem = {
  key: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export type NormalizedInvoice = {
  invoice_number: string
  customer_name: string
  invoice_date: string
  due_date: string
  subtotal_amount: number
  tax_amount: number
  total_amount: number
  outstanding_amount: number
  items: NormalizedLineItem[]
}

export type LineItemChangeStatus = "unchanged" | "modified" | "added" | "removed"

export type FieldDiff = {
  field: keyof NormalizedInvoice
  label: string
  current: string
  proposed: string
  changed: boolean
}

export type LineItemDiff = {
  status: LineItemChangeStatus
  description: string
  current?: NormalizedLineItem
  proposed?: NormalizedLineItem
}

export type InvoiceDiffResult = {
  fieldDiffs: FieldDiff[]
  lineItemDiffs: LineItemDiff[]
  summaryChips: string[]
  hasChanges: boolean
  totalDelta: number | null
  changedLineItemCount: number
}

const FIELD_LABELS: Record<Exclude<keyof NormalizedInvoice, "items">, string> = {
  invoice_number: "Invoice number",
  customer_name: "Customer",
  invoice_date: "Issue date",
  due_date: "Due date",
  subtotal_amount: "Subtotal",
  tax_amount: "Tax",
  total_amount: "Total",
  outstanding_amount: "Outstanding",
}

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const formatDate = (value: string): string => {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString()
}

const pick = (invoice: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = invoice[key]
    if (value != null && value !== "") return value
  }
  return null
}

const lineItemKey = (description: string, index: number): string => {
  const normalized = description.toLowerCase().trim()
  return normalized || `__row_${index}`
}

const normalizeLineItems = (rawItems: unknown[]): NormalizedLineItem[] =>
  rawItems.map((item, index) => {
    const row = item as Record<string, unknown>
    const description = String(
      pick(row, ["description", "product_name", "name", "product"]) ?? ""
    )
    const quantity = toNumber(row.quantity ?? row.qty, 0)
    const unitPrice = toNumber(row.unit_price ?? row.rate ?? row.price, 0)
    const amount = toNumber(row.amount ?? row.total ?? row.line_total, quantity * unitPrice)
    return {
      key: lineItemKey(description, index),
      description: description || "Item",
      quantity,
      unit_price: unitPrice,
      amount,
    }
  })

export function normalizeInvoiceFromRecord(invoice: Record<string, unknown>): NormalizedInvoice {
  const rawItems = Array.isArray(invoice.items)
    ? invoice.items
    : Array.isArray(invoice.invoice_items)
      ? invoice.invoice_items
      : []
  return {
    invoice_number: String(pick(invoice, ["invoice_number", "invoiceNumber"]) ?? ""),
    customer_name: String(pick(invoice, ["customer_name", "customerName"]) ?? ""),
    invoice_date: String(pick(invoice, ["invoice_date", "issue_date", "invoiceDate"]) ?? ""),
    due_date: String(pick(invoice, ["due_date", "dueDate"]) ?? ""),
    subtotal_amount: toNumber(pick(invoice, ["subtotal_amount", "subtotal"]), 0),
    tax_amount: toNumber(pick(invoice, ["tax_amount", "tax", "tax_total"]), 0),
    total_amount: toNumber(pick(invoice, ["total_amount", "total"]), 0),
    outstanding_amount: toNumber(pick(invoice, ["outstanding_amount", "outstanding"]), 0),
    items: normalizeLineItems(rawItems),
  }
}

export function normalizeInvoiceFromDispute(
  invoice: Partial<Invoice> | undefined,
  items: InvoiceItem[],
  fallbackInvoiceNumber?: string
): NormalizedInvoice {
  return {
    invoice_number: invoice?.invoice_number ?? fallbackInvoiceNumber ?? "",
    customer_name: invoice?.customer?.customer_name ?? "",
    invoice_date: invoice?.invoice_date ?? "",
    due_date: invoice?.due_date ?? "",
    subtotal_amount: invoice?.subtotal_amount ?? 0,
    tax_amount: invoice?.tax_amount ?? 0,
    total_amount: invoice?.total_amount ?? 0,
    outstanding_amount: invoice?.outstanding_amount ?? 0,
    items: items.map((item, index) => ({
      key: lineItemKey(item.description, index),
      description: item.description || "Item",
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.amount,
    })),
  }
}

const formatFieldValue = (field: keyof NormalizedInvoice, value: unknown): string => {
  if (field === "invoice_date" || field === "due_date") {
    return formatDate(String(value ?? ""))
  }
  if (
    field === "subtotal_amount" ||
    field === "tax_amount" ||
    field === "total_amount" ||
    field === "outstanding_amount"
  ) {
    return formatCurrency(toNumber(value))
  }
  const text = String(value ?? "").trim()
  return text || "—"
}

const lineItemsEqual = (a: NormalizedLineItem, b: NormalizedLineItem): boolean =>
  a.description === b.description &&
  a.quantity === b.quantity &&
  a.unit_price === b.unit_price &&
  a.amount === b.amount

export function computeInvoiceDiff(
  current: NormalizedInvoice,
  proposed: NormalizedInvoice
): InvoiceDiffResult {
  const scalarFields = Object.keys(FIELD_LABELS) as Array<Exclude<keyof NormalizedInvoice, "items">>

  const fieldDiffs: FieldDiff[] = scalarFields.map((field) => {
    const currentValue = current[field]
    const proposedValue = proposed[field]
    const changed =
      field === "subtotal_amount" ||
      field === "tax_amount" ||
      field === "total_amount" ||
      field === "outstanding_amount"
        ? toNumber(currentValue) !== toNumber(proposedValue)
        : String(currentValue ?? "") !== String(proposedValue ?? "")

    return {
      field,
      label: FIELD_LABELS[field],
      current: formatFieldValue(field, currentValue),
      proposed: formatFieldValue(field, proposedValue),
      changed,
    }
  })

  const currentByKey = new Map(current.items.map((item) => [item.key, item]))
  const proposedByKey = new Map(proposed.items.map((item) => [item.key, item]))
  const allKeys = new Set([...currentByKey.keys(), ...proposedByKey.keys()])

  const lineItemDiffs: LineItemDiff[] = []
  let changedLineItemCount = 0

  for (const key of allKeys) {
    const currentItem = currentByKey.get(key)
    const proposedItem = proposedByKey.get(key)

    if (currentItem && proposedItem) {
      const status: LineItemChangeStatus = lineItemsEqual(currentItem, proposedItem)
        ? "unchanged"
        : "modified"
      if (status === "modified") changedLineItemCount += 1
      lineItemDiffs.push({
        status,
        description: proposedItem.description || currentItem.description,
        current: currentItem,
        proposed: proposedItem,
      })
    } else if (!currentItem && proposedItem) {
      changedLineItemCount += 1
      lineItemDiffs.push({
        status: "added",
        description: proposedItem.description,
        proposed: proposedItem,
      })
    } else if (currentItem && !proposedItem) {
      changedLineItemCount += 1
      lineItemDiffs.push({
        status: "removed",
        description: currentItem.description,
        current: currentItem,
      })
    }
  }

  const totalDelta =
    current.total_amount !== proposed.total_amount
      ? proposed.total_amount - current.total_amount
      : null

  const summaryChips: string[] = []

  if (totalDelta != null && totalDelta !== 0) {
    summaryChips.push(`Total ${formatCurrencyDelta(totalDelta)}`)
  }

  if (changedLineItemCount > 0) {
    summaryChips.push(
      `${changedLineItemCount} line item${changedLineItemCount === 1 ? "" : "s"} changed`
    )
  }

  const dueDateChanged = fieldDiffs.find((f) => f.field === "due_date")?.changed
  if (dueDateChanged) {
    summaryChips.push("Due date updated")
  }

  const changedScalarCount = fieldDiffs.filter(
    (f) => f.changed && f.field !== "due_date" && !f.field.endsWith("_amount")
  ).length
  if (changedScalarCount > 0 && !summaryChips.length) {
    summaryChips.push(`${changedScalarCount} field${changedScalarCount === 1 ? "" : "s"} updated`)
  }

  const hasChanges =
    fieldDiffs.some((f) => f.changed) || lineItemDiffs.some((d) => d.status !== "unchanged")

  return {
    fieldDiffs,
    lineItemDiffs,
    summaryChips,
    hasChanges,
    totalDelta,
    changedLineItemCount,
  }
}
