import { arApi } from "@/lib/axios"
import { readTotalCount, toPaginatedList, type PaginatedList } from "@/lib/table"
import type { GoodsReceiptNote, GrnUploadBatch } from "../types"

export interface ListGrnsParams {
  status?: string
  search?: string
  grn_date_from?: string
  grn_date_to?: string
  sort_by?: string
  sort_order?: "asc" | "desc"
  limit?: number
  offset?: number
}

export interface LinkGrnPoResponse {
  grn_id: string
  po_id: string
  linked: boolean
  status: "LINKED" | "UNLINKED" | "FAILED"
}

export const grnService = {
  listGrns: async (params?: ListGrnsParams): Promise<PaginatedList<GoodsReceiptNote>> => {
    const response = await arApi.get("/grns", { params })
    const items: GoodsReceiptNote[] = response.data.goods_receipt_notes ?? []
    const total = readTotalCount(response, {
      bodyTotal: response.data.total,
      itemsLength: items.length,
    })
    return toPaginatedList(items, total)
  },

  getBatchStatus: async (id: string): Promise<GrnUploadBatch> => {
    const response = await arApi.get(`/grn-upload/batches/${id}/status`)
    return response.data
  },

  getBatchGrns: async (id: string): Promise<GoodsReceiptNote[]> => {
    const response = await arApi.get(`/grn-upload/batches/${id}/grns`)
    return response.data.goods_receipt_notes
  },

  getGrn: async (id: string): Promise<GoodsReceiptNote> => {
    const response = await arApi.get(`/grns/${id}`)
    return response.data
  },

  linkPo: async (grnId: string, poId: string): Promise<LinkGrnPoResponse> => {
    const response = await arApi.post(`/grns/${grnId}/link-po`, { po_id: poId })
    return response.data
  },

  downloadSourcePdf: async (id: string): Promise<Blob> => {
    const response = await arApi.get(`/grns/${id}/source-pdf`, {
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
    filename = "goods-receipt-note.pdf"
  ): Promise<void> => {
    const blob = await grnService.downloadSourcePdf(id)
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

export default grnService
