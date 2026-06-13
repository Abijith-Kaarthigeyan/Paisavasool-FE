import { arApi } from "@/lib/axios"
import { 
  PaymentUploadCreateResponse, 
  PaymentUploadResponse, 
  PaymentUploadStatusResponse 
} from "../types"

export const paymentService = {
  uploadPaymentPdf: async (file: File): Promise<PaymentUploadCreateResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await arApi.post<PaymentUploadCreateResponse>("/payment-upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  listPaymentUploads: async (params?: { limit?: number; offset?: number }): Promise<PaymentUploadResponse[]> => {
    const response = await arApi.get<PaymentUploadResponse[]>("/payment-upload", { params });
    return response.data;
  },

  getPaymentUpload: async (id: string): Promise<PaymentUploadResponse> => {
    const response = await arApi.get<PaymentUploadResponse>(`/payment-upload/${id}`);
    return response.data;
  },

  getPaymentUploadStatus: async (id: string): Promise<PaymentUploadStatusResponse> => {
    const response = await arApi.get<PaymentUploadStatusResponse>(`/payment-upload/${id}/status`);
    return response.data;
  },
};

export default paymentService;
