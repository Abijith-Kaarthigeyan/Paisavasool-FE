import type { Invoice } from "@/features/invoices/types"

export interface InvoicePoContext {
  poId: string | null
  poNumber: string | null
  hasLinkedPo: boolean
  hasAwaitingMatch: boolean
}

export function getInvoicePoContext(
  invoice?: Partial<Invoice> | null
): InvoicePoContext {
  const poId = invoice?.po_id ?? invoice?.purchase_order?.id ?? null
  const poNumber = invoice?.po_number ?? invoice?.purchase_order?.po_number ?? null

  return {
    poId,
    poNumber,
    hasLinkedPo: !!poId,
    hasAwaitingMatch: !!poNumber && !poId,
  }
}
