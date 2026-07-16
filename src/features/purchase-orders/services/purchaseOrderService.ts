import { arApi } from "@/lib/axios"
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
}

export default purchaseOrderService
