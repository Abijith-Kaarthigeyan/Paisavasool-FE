import { useQuery } from "@tanstack/react-query"
import { listQueryOptions } from "@/lib/listQueryOptions"
import { paymentService, type PaymentUploadListParams } from "../services/paymentService"
import { PaymentUploadResponse, PaymentUploadStatusResponse } from "../types"

const TERMINAL_UPLOAD_STATUSES = new Set(["MATCHED", "FAILED", "REVIEW_REQUIRED"])

export const usePaymentUploads = (
  params?: PaymentUploadListParams,
  options?: { refetchInterval?: number | false }
) => {
  return useQuery<PaymentUploadResponse[]>({
    queryKey: ["paymentUploads", params],
    queryFn: () => paymentService.listPaymentUploads(params),
    ...listQueryOptions,
    ...options,
  })
}

export const usePaymentUploadFilterOptions = () => {
  return useQuery({
    queryKey: ["paymentUploadFilterOptions"],
    queryFn: () => paymentService.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
  })
}

export const usePaymentUpload = (id: string | undefined, options?: object) => {
  return useQuery<PaymentUploadResponse>({
    queryKey: ["paymentUpload", id],
    queryFn: () => paymentService.getPaymentUpload(id!),
    enabled: !!id,
    ...options,
  })
}

export const usePaymentUploadStatus = (id: string | undefined, options?: object) => {
  return useQuery<PaymentUploadStatusResponse>({
    queryKey: ["paymentUploadStatus", id],
    queryFn: () => paymentService.getPaymentUploadStatus(id!),
    enabled: !!id,
    refetchInterval: (query: { state: { data?: PaymentUploadStatusResponse } }) => {
      const data = query.state.data
      if (data && TERMINAL_UPLOAD_STATUSES.has(data.status)) {
        return false
      }
      return 2000
    },
    ...options,
  })
}
