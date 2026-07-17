import { arApi } from "@/lib/axios"
import type { GoodsReceiptNote } from "@/features/grn/types"
import type { Invoice } from "@/features/invoices/types"
import type {
  LinkInvoiceResponse,
  PoUploadBatch,
  PurchaseOrder,
  PurchaseOrderItem,
} from "../types"

export const purchaseOrderService = {
  listPurchaseOrders: async (params?: {
    customer_id?: string
    status?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<PurchaseOrder[]> => {
    const response = await arApi.get("/purchase-orders", { params })
    return response.data.purchase_orders
  },

  getPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await arApi.get(`/purchase-orders/${id}`)
    return response.data
  },

  getPurchaseOrderItems: async (id: string): Promise<PurchaseOrderItem[]> => {
    const response = await arApi.get(`/purchase-orders/${id}/items`)
    return response.data
  },

  getLinkedInvoices: async (id: string): Promise<Invoice[]> => {
    const response = await arApi.get(`/purchase-orders/${id}/invoices`)
    return response.data.invoices
  },

  getLinkedGrns: async (id: string): Promise<GoodsReceiptNote[]> => {
    const response = await arApi.get(`/purchase-orders/${id}/grns`)
    return response.data.goods_receipt_notes
  },

  linkInvoice: async (
    poId: string,
    invoiceId: string
  ): Promise<LinkInvoiceResponse> => {
    const response = await arApi.post(`/purchase-orders/${poId}/link-invoice`, {
      invoice_id: invoiceId,
    })
    return response.data
  },

  getBatchStatus: async (id: string): Promise<PoUploadBatch> => {
    const response = await arApi.get(`/po-upload/batches/${id}/status`)
    return response.data
  },

  getBatchPurchaseOrders: async (id: string): Promise<PurchaseOrder[]> => {
    const response = await arApi.get(`/po-upload/batches/${id}/purchase-orders`)
    return response.data.purchase_orders
  },

  downloadSourcePdf: async (id: string): Promise<Blob> => {
    const response = await arApi.get(`/purchase-orders/${id}/source-pdf`, {
      responseType: "blob",
    })
    const blob = response.data as Blob
    if (blob.type === "application/json") {
      const message = await blob.text()
      throw new Error(message || "Failed to download source PDF")
    }
    return blob
  },

  openSourcePdfInTab: async (
    targetTab: Window | null,
    id: string,
    filename = "purchase-order.pdf"
  ): Promise<void> => {
    const blob = await purchaseOrderService.downloadSourcePdf(id)
    const pdfBlob =
      blob.type === "application/pdf"
        ? blob
        : new Blob([blob], { type: "application/pdf" })
    const url = URL.createObjectURL(pdfBlob)

    if (targetTab && !targetTab.closed) {
      targetTab.location.href = url
      targetTab.document.title = filename
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      return
    }

    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.rel = "noopener"
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  },
}

export default purchaseOrderService
