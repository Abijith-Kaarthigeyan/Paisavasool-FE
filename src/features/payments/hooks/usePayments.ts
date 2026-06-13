import { useQuery } from "@tanstack/react-query"
import { paymentService } from "../services/paymentService"
import { PaymentUploadResponse, PaymentUploadStatusResponse } from "../types"

export const usePaymentUploads = (
  params?: { limit?: number; offset?: number },
  options?: any
) => {
  return useQuery<PaymentUploadResponse[]>({
    queryKey: ["paymentUploads", params],
    queryFn: () => paymentService.listPaymentUploads(params),
    ...options,
  });
};

export const usePaymentUpload = (id: string | undefined, options?: any) => {
  return useQuery<PaymentUploadResponse>({
    queryKey: ["paymentUpload", id],
    queryFn: () => paymentService.getPaymentUpload(id!),
    enabled: !!id,
    ...options,
  });
};

export const usePaymentUploadStatus = (id: string | undefined, options?: any) => {
  return useQuery<PaymentUploadStatusResponse>({
    queryKey: ["paymentUploadStatus", id],
    queryFn: () => paymentService.getPaymentUploadStatus(id!),
    enabled: !!id,
    refetchInterval: (query: any) => {
      const data = query.state.data as PaymentUploadStatusResponse | undefined;
      if (data && (data.status === "MATCHED" || data.status === "FAILED" || data.status === "REVIEW_REQUIRED")) {
        return false;
      }
      return 2000; // Poll status every 2 seconds if still UPLOADED/PROCESSING
    },
    ...options,
  });
};
