import { arApi } from "@/lib/axios"
import type { GoodsReceiptNote, GrnUploadBatch } from "../types"

export const grnService = {
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
