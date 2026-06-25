import { arApi } from "@/lib/axios"
import { InvoiceUploadBatch, Invoice, InvoiceItem, InvoiceVersionSummary, InvoiceVersionDetail } from "../types"

export const invoiceService = {
  uploadPdf: async (
    file: File,
    onProgress: (percent: number) => void
  ): Promise<{ success: boolean; batch_id: string; status: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await arApi.post("/invoice-upload/pdf", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  uploadZip: async (
    file: File,
    onProgress: (percent: number) => void
  ): Promise<{ success: boolean; batch_id: string; status: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await arApi.post("/invoice-upload/zip", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  },

  getBatchStatus: async (id: string): Promise<InvoiceUploadBatch> => {
    const response = await arApi.get(`/invoice-upload/batches/${id}/status`);
    return response.data;
  },

  getBatchInvoices: async (id: string): Promise<Invoice[]> => {
    const response = await arApi.get(`/invoice-upload/batches/${id}/invoices`);
    return response.data.invoices;
  },

  getInvoices: async (params?: {
    customer_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Invoice[]> => {
    const response = await arApi.get("/invoices", { params });
    return response.data.invoices;
  },

  getInvoiceDetails: async (id: string): Promise<Invoice> => {
    const response = await arApi.get(`/invoices/${id}`);
    return response.data;
  },

  getInvoiceItems: async (id: string): Promise<InvoiceItem[]> => {
    const response = await arApi.get(`/invoices/${id}/items`);
    return response.data;
  },

  getInvoiceVersions: async (id: string): Promise<InvoiceVersionSummary[]> => {
    const response = await arApi.get(`/invoices/${id}/versions`);
    return response.data.versions;
  },

  getInvoiceVersion: async (id: string, version: number): Promise<InvoiceVersionDetail> => {
    const response = await arApi.get(`/invoices/${id}/versions/${version}`);
    return response.data;
  },
};
export default invoiceService;
