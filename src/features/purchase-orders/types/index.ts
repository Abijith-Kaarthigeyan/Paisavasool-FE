import type {
  BatchStatus,
  Customer,
  FileStatus,
  InvoiceUploadBatch,
  InvoiceUploadFile,
} from "@/features/invoices/types"

export type { BatchStatus, FileStatus }
export type PoUploadBatch = InvoiceUploadBatch
export type PoUploadFile = InvoiceUploadFile

export type PurchaseOrderStatus = "OPEN" | "PARTIALLY_INVOICED" | "CLOSED"

export interface PurchaseOrderSummary {
  id: string
  po_number: string
  po_date: string
  currency: "INR" | "USD" | "EUR" | "GBP"
  total_amount: number
  status: PurchaseOrderStatus
}

export interface PurchaseOrder extends PurchaseOrderSummary {
  customer_id: string
  customer?: Customer
  subtotal_amount: number
  tax_amount: number
  batch_id: string | null
  created_at: string
  updated_at: string
}

export interface PurchaseOrderItem {
  id: string
  po_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  created_at: string
}

export interface LinkInvoiceResponse {
  po_id: string
  invoice_id: string
  linked: boolean
  po_status: PurchaseOrderStatus
}
