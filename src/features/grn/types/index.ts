import type {
  BatchStatus,
  FileStatus,
  InvoiceUploadBatch,
  InvoiceUploadFile,
} from "@/features/invoices/types"

export type { BatchStatus, FileStatus }
export type GrnUploadBatch = InvoiceUploadBatch
export type GrnUploadFile = InvoiceUploadFile

export type GrnStatus = "LINKED" | "UNLINKED" | "FAILED"

export interface GoodsReceiptNoteItem {
  id: string
  grn_id: string
  description: string
  quantity: number
  created_at: string
}

export interface GoodsReceiptNote {
  id: string
  grn_number: string
  grn_date: string
  po_number: string | null
  po_id: string | null
  notes: string | null
  status: GrnStatus
  batch_id: string | null
  has_source_pdf: boolean
  source_file_name: string | null
  items: GoodsReceiptNoteItem[]
  created_at: string
  updated_at: string
}
