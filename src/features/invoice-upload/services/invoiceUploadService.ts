import { api } from "@/lib/axios"
import { ENV } from "@/config/env"
import {
  InvoiceUploadBatch,
  Invoice,
  InvoiceItem,
  ReviewQueueItem,
} from "../types/invoiceUpload.types"

export const invoiceUploadService = {
  uploadPdf: async (
    file: File,
    onProgress: (percent: number) => void
  ): Promise<{ success: boolean; batch_id: string; status: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`${ENV.AR_API_BASE_URL}/invoice-upload/pdf`, formData, {
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

    const response = await api.post(`${ENV.AR_API_BASE_URL}/invoice-upload/zip`, formData, {
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
    const response = await api.get(`${ENV.AR_API_BASE_URL}/invoice-upload/batches/${id}/status`);
    return response.data;
  },

  getBatchInvoices: async (id: string): Promise<Invoice[]> => {
    const response = await api.get(`${ENV.AR_API_BASE_URL}/invoice-upload/batches/${id}/invoices`);
    return response.data.invoices;
  },

  getInvoices: async (params?: {
    customer_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Invoice[]> => {
    const response = await api.get(`${ENV.AR_API_BASE_URL}/invoices`, { params });
    return response.data.invoices;
  },

  getInvoiceDetails: async (id: string): Promise<Invoice> => {
    const response = await api.get(`${ENV.AR_API_BASE_URL}/invoices/${id}`);
    return response.data;
  },

  getInvoiceItems: async (id: string): Promise<InvoiceItem[]> => {
    const response = await api.get(`${ENV.AR_API_BASE_URL}/invoices/${id}/items`);
    return response.data;
  },

  getReviewQueue: async (): Promise<ReviewQueueItem[]> => {
    const response = await api.get(`${ENV.AR_API_BASE_URL}/review-queue`);
    return response.data.items;
  },
};
